import { FastifyInstance } from 'fastify';
import prisma from '../services/db';
import { roomService } from "../services/livekit";
import { Room } from 'livekit-server-sdk';

export default async function candidatesRoutes(fastify: FastifyInstance) {
  // Candidate register
  fastify.post("/", async (req) => {
    const { firstName, lastName, email, phone, department, position, company, resume } =
      req.body as any;

    const candidate = await prisma.candidate.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        department,
        position,
        company,
        resume,
      },
    });

    async function generateUniqueInterviewCode(length: number = 6): Promise<string> {
      const min = Math.pow(10, length - 1);   // örn. 100000
      const max = Math.pow(10, length) - 1;   // örn. 999999

      let code: string;
      let exists = true; // check database for uniqueness

      while (exists) {
        code = Math.floor(Math.random() * (max - min + 1) + min).toString();

        const check = await prisma.interview.findUnique({
          where: { interviewId: code },
        });

        exists = !!check;
      }

      return code!;
    }

    const uniqueCode = await generateUniqueInterviewCode();

    const interview = await prisma.interview.create({
      data: {
        candidateId: candidate.id,
        interviewId: uniqueCode,
      },
    });

    return { candidate, interview };
});
  fastify.post("/start", async (req, reply) => {
      const  { lastName, interviewId } = req.body as { lastName: string, interviewId: string };

      const interview = await prisma.interview.findUnique({
          where: { interviewId },
          include: { candidate: true },
      });

      if (!interview) return reply.status(404).send({error: "Interview not found"});
      if (interview.candidate.lastName.toLowerCase() !== lastName.toLowerCase()) {
          return reply.status(401).send({error: "unauthorized"});
      }

      await prisma.interview.update({
          where: {id: interview.id},
          data: { status: "started", startedAt: new Date()},
      });

      const prompt = `
İLK CÜMLEYİ KESİNLİKLE SEN KUR İLK GİRDİYİ BEKLEME.
Sen Türkçe konuşan bir yapay zekâ mülakat simülatörüsün. 
Lütfen sadece Türkçe konuş. Asla başka bir dil kullanma. 
Rolün: aday ile gerçek bir iş görüşmesi yapan bir **İK uzmanı / teknik mülakatçı** gibi davranmak.

### Aday Bilgileri
- Ad Soyad: ${interview.candidate.firstName} ${interview.candidate.lastName}
- Pozisyon: ${interview.candidate.position}
- Departman: ${interview.candidate.department || "Belirtilmemiş"}
- Şirket: ${interview.candidate.company || "Belirtilmemiş"}
- CV Özeti: ${interview.candidate.resume || "CV boş ya da eksik. Öncelikle adaydan bu bilgileri doğrulamasını iste."}

### Görüşme Kuralları
1. Türkçe konuş. Girişte karşıdan beklemeden konuşmaya başla ve kendini tanıt
2. Önce CV’deki bilgileri aday ile doğrula.
   - Eğer CV boş/eksikse: adaydan iş geçmişini, tecrübelerini ve eğitim bilgilerini kısaca aktarmasını rica et.
3. Ardından birkaç **davranışsal soru** sor (ör: takım çalışması, iletişim becerileri, problem çözme).
4. Daha sonra **teknik sorulara** geç. Adayın başvurduğu **${interview.candidate.position}** pozisyonuna uygun konular seç:
   - Eğer yazılım geliştirici: algoritmalar, veri yapıları, yazılım dili bilgisi
   - Eğer satış: müşteri ilişkileri, ikna yetenekleri
   - vb.
5. Pozisyonu bilmesen bile her zaman genel profesyonel sorular sorabilirsin.
6. Çok uzun paragraflarla cevap verme, kısa-orta uzunlukta net cümleler kur.
7. Görüşmenin sonunda adayla teşekkür et ve kısa bir değerlendirme notu ver.

### Ton & Persona
- Samimi ama profesyonel.
- Açık uçlu sorular sor.
- İkinci şahıs ("sen") ile hitap et.
`;

      const roomOpts = {
        name: interviewId,
        emptyTimeout: 298,
        maxParticipants: 10,
        metadata: JSON.stringify({ prompt }),
      }

      try {
          await roomService.createRoom(roomOpts).then((room: Room) => {
            console.log(`✅Room created: ${room.name} with SID: ${room.sid} and metadata: ${room.metadata}, max partitipants: ${room.maxParticipants}, emptyTO:${room.emptyTimeout}`, room);
          });
          console.log(`✅ Room created with metadata for interview ${interviewId}`);
        } catch (err: any) {
          if (err.message.includes("Room already exists")) {
            console.log("⚠️ Room already exists, updating metadata...");
            const updated = await roomService.updateRoomMetadata(interviewId, JSON.stringify({ prompt }))
            console.log("Updated metadata:", updated.metadata)
          } else {
            throw err;
          }
      }



      console.log(`Room created for interview ${interviewId}, prompt: ${prompt}`);

      return { message: "Interview started", interview, prompt };
  });
}