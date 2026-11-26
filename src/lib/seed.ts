import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  comments,
  favorites,
  forumReplies,
  forumTopics,
  ratings,
  resources,
  tips,
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { writeSampleFile } from "@/lib/storage";

let seeded = false;

const SAMPLE_FILES: Record<string, string> = {
  "PLE_2023_Maths.pdf.txt": `NATIONAL EXAMINATIONS BOARD — PRIMARY LEAVING EXAMINATION (PLE)
MATHEMATICS — 2023 (SAMPLE)
--------------------------------------------
Section A: Objective
1. What is 1/2 + 1/4?  A. 3/4  B. 2/6  C. 1/8  D. 4/2
2. A rectangle has length 8 cm and width 5 cm. Find its area.
3. Round 4,678 to the nearest hundred.
...
Section B: Written
1. A trader bought 12 books at UGX 2,500 each. He sold them all at UGX 3,200 each.
   (a) How much did he pay in total?
   (b) Calculate his profit.
--------------------------------------------
Answer key on the last page. Prepared for EduShare Uganda.`,

  "UCE_2022_Physics.pdf.txt": `UGANDA CERTIFICATE OF EDUCATION (UCE) — O-LEVEL
PHYSICS PAPER 1 — 2022 (SAMPLE)
--------------------------------------------
1. State Newton's three laws of motion with one example each.
2. A car accelerates uniformly from rest to 20 m/s in 10 s.
   (a) Calculate the acceleration.
   (b) Find the distance covered.
3. Explain the principle of moments and give two daily-life applications.
...
Practical: Construct a simple circuit to measure the resistance of a resistor.
--------------------------------------------
Worked solutions included. EduShare Uganda — learn together.`,

  "UACE_2021_GeneralPaper.pdf.txt": `UGANDA ADVANCED CERTIFICATE OF EDUCATION (UACE) — A-LEVEL
GENERAL PAPER — 2021 (SAMPLE)
--------------------------------------------
Essay: "Examine the impact of population growth on Uganda's economy."
Guidance: Discuss employment, healthcare, education and the environment.
...
Comprehension: Read the passage on East African integration and answer questions.
--------------------------------------------
Model essay structure provided. EduShare Uganda.`,

  "OLevel_SchemesOfWork_Maths.pdf.txt": `SCHEME OF WORK — MATHEMATICS (O-LEVEL, S.1 TERM 1)
WEEK 1: Numbers — place value, operations
WEEK 2: Fractions, decimals and percentages
WEEK 3: Indices and logarithms (introduction)
WEEK 4: Algebra — expressions and equations
WEEK 5: Geometry — angles and triangles
...
Assessment: End-of-term test (40 marks)
Reference: NCDC O-Level Mathematics syllabus.`,

  "PLE_Notes_SST.pdf.txt": `PRIMARY — SOCIAL STUDIES REVISION NOTES
Topic: The Physical Features of Uganda
- Mountains: Rwenzori (Mt. Stanley highest), Elgon, Moroto
- Lakes: Victoria (largest), Kyoga, Albert, Edward, George
- Rivers: Nile (longest), Katonga, Kagera
- Climate: equatorial, two rainy seasons
...
Activity: Draw a map of Uganda and label the features above.`,

  "ALevel_CombinationBioChem.pdf.txt": `A-LEVEL SUBJECT COMBINATIONS — SCIENCES
PCM: Physics, Chemistry, Mathematics
BCM: Biology, Chemistry, Mathematics
PCB: Physics, Chemistry, Biology
MCB: Mathematics, Chemistry, Biology
...
Arts combinations: HEG, LEG, MEG, DEF, LFA, etc.
Career paths and university entry requirements (Makerere, Kyambogo, MUST, Gulu).`,

  "BTVET_Entrepreneurship.pdf.txt": `BTVET — ENTREPRENEURSHIP MODULE
Unit 1: Identifying a business opportunity
Unit 2: Writing a simple business plan
Unit 3: Record keeping and bookkeeping
Unit 4: Marketing for small enterprises
...
Assessment: Present a business idea to the class.`,

  "Luganda_Basics.pdf.txt": `OLULIMI OLW'OLUGANDA — EBIYIZO EBISooka
1. Nze ndi mwana w'omuwala / omulenzi. (I am a boy/girl.)
2. Ennyumba — house; Emmeeza — table; Enttebe — chair.
3. Empisa: Okugondera abakulu. (Respect for elders.)
...
Exercise: Greet your friend in Luganda and introduce yourself.`,
};

export async function ensureSeed(): Promise<void> {
  if (seeded) return;
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);
  if (count > 0) {
    seeded = true;
    return;
  }

  // ---- Educators & a demo student -------------------------------------
  const mwalimu = await db
    .insert(users)
    .values({
      username: "mwalimu",
      email: "mwalimu@edushare.ug",
      passwordHash: hashPassword("edushare123"),
      fullName: "Hadijah Namukasa",
      role: "educator",
      school: "Makerere College School",
      bio: "Physics & Maths teacher. Sharing free revision material for UNEB exams since 2014.",
    })
    .returning();

  const teacher2 = await db
    .insert(users)
    .values({
      username: "musa",
      email: "musa@edushare.ug",
      passwordHash: hashPassword("edushare123"),
      fullName: "Musa Kalyango",
      role: "educator",
      school: "St. Mary's Kitende",
      bio: "A-Level General Paper and History specialist.",
    })
    .returning();

  const teacher3 = await db
    .insert(users)
    .values({
      username: "nankya",
      email: "nankya@edushare.ug",
      passwordHash: hashPassword("edushare123"),
      fullName: "Ritah Nankya",
      role: "educator",
      school: "Nabisunsa Girls",
      bio: "Primary teacher — Social Studies & Luganda. I love making revision fun!",
    })
    .returning();

  await db.insert(users).values({
    username: "student1",
    email: "student@edushare.ug",
    passwordHash: hashPassword("edushare123"),
    fullName: "David Okello",
    role: "student",
    school: "Kololo Secondary School",
    bio: "S.4 candidate revising for UCE.",
  });

  // ---- Resources ------------------------------------------------------
  const resourceDefs: {
    user: number;
    title: string;
    description: string;
    subject: string;
    level: string;
    file: keyof typeof SAMPLE_FILES;
    downloads: number;
    rating: number;
    ratingCount: number;
  }[] = [
    {
      user: mwalimu[0].id,
      title: "PLE 2023 Mathematics Past Paper",
      description:
        "Full Primary Leaving Examination Mathematics paper with answer key. Great for final revision.",
      subject: "mathematics",
      level: "primary",
      file: "PLE_2023_Maths.pdf.txt",
      downloads: 1287,
      rating: 5,
      ratingCount: 42,
    },
    {
      user: mwalimu[0].id,
      title: "UCE 2022 Physics Paper 1",
      description:
        "O-Level Physics Paper 1 with worked solutions covering mechanics, electricity and heat.",
      subject: "physics",
      level: "o-level",
      file: "UCE_2022_Physics.pdf.txt",
      downloads: 934,
      rating: 5,
      ratingCount: 31,
    },
    {
      user: teacher2[0].id,
      title: "UACE 2021 General Paper",
      description:
        "A-Level General Paper essay and comprehension with a model essay structure.",
      subject: "general-paper",
      level: "a-level",
      file: "UACE_2021_GeneralPaper.pdf.txt",
      downloads: 612,
      rating: 4,
      ratingCount: 18,
    },
    {
      user: mwalimu[0].id,
      title: "O-Level Maths Scheme of Work (S.1)",
      description:
        "Termly scheme of work for Senior 1 Mathematics aligned to the NCDC syllabus.",
      subject: "mathematics",
      level: "o-level",
      file: "OLevel_SchemesOfWork_Maths.pdf.txt",
      downloads: 455,
      rating: 5,
      ratingCount: 22,
    },
    {
      user: teacher3[0].id,
      title: "Primary Social Studies Revision Notes",
      description:
        "Bright, simple notes on the physical features of Uganda with a fun map activity.",
      subject: "social-studies",
      level: "primary",
      file: "PLE_Notes_SST.pdf.txt",
      downloads: 803,
      rating: 5,
      ratingCount: 27,
    },
    {
      user: teacher2[0].id,
      title: "A-Level Science Subject Combinations Guide",
      description:
        "Everything you need to know about PCM, BCM, PCB and arts combinations + careers.",
      subject: "other",
      level: "a-level",
      file: "ALevel_CombinationBioChem.pdf.txt",
      downloads: 540,
      rating: 4,
      ratingCount: 15,
    },
    {
      user: teacher3[0].id,
      title: "BTVET Entrepreneurship Module",
      description:
        "Practical module on starting and running a small business — perfect for UBTEB/DIT.",
      subject: "entrepreneurship",
      level: "btvet",
      file: "BTVET_Entrepreneurship.pdf.txt",
      downloads: 321,
      rating: 4,
      ratingCount: 12,
    },
    {
      user: teacher3[0].id,
      title: "Luganda for Beginners",
      description:
        "Simple Luganda phrases and vocabulary for primary learners and new speakers.",
      subject: "luganda",
      level: "pre-primary",
      file: "Luganda_Basics.pdf.txt",
      downloads: 268,
      rating: 5,
      ratingCount: 9,
    },
  ];

  for (const def of resourceDefs) {
    const sample = await writeSampleFile(def.file, SAMPLE_FILES[def.file]);
    const [res] = await db
      .insert(resources)
      .values({
        userId: def.user,
        title: def.title,
        description: def.description,
        subject: def.subject,
        level: def.level,
        fileUrl: sample.fileUrl,
        fileName: def.file.replace(".txt", ""),
        fileSize: sample.fileSize,
        fileType: "application/pdf",
        downloads: def.downloads,
        avgRating: def.rating,
        ratingCount: def.ratingCount,
      })
      .returning();
    void res;
  }

  // Add a couple of ratings/comments/favorites for realism
  const allResources = await db.select().from(resources);
  if (allResources[0] && allResources[1]) {
    await db.insert(comments).values([
      {
        resourceId: allResources[0].id,
        userId: mwalimu[0].id,
        content:
          "Please share more PLE papers from other years! These are helping my sister so much. 💚",
      },
      {
        resourceId: allResources[0].id,
        userId: teacher2[0].id,
        content: "The answer key on the last page is super clear. Thank you!",
      },
    ]);
    await db.insert(favorites).values([
      { userId: mwalimu[0].id, resourceId: allResources[1].id },
      { userId: teacher3[0].id, resourceId: allResources[0].id },
    ]);
    await db.insert(ratings).values([
      { userId: teacher2[0].id, resourceId: allResources[0].id, rating: 5 },
      { userId: teacher3[0].id, resourceId: allResources[0].id, rating: 5 },
    ]);
  }

  // ---- Forum topics ---------------------------------------------------
  const topic1 = await db
    .insert(forumTopics)
    .values({
      userId: mwalimu[0].id,
      title: "Best way to revise for UCE Physics in 3 weeks?",
      body: "My candidates have 3 weeks to finals. How do you structure last-minute Physics revision so they cover the whole syllabus without panic?",
      subject: "physics",
      level: "o-level",
      views: 156,
    })
    .returning();

  await db.insert(forumReplies).values([
    {
      topicId: topic1[0].id,
      userId: teacher2[0].id,
      content:
        "Past papers, past papers, past papers! Do one paper per day under timed conditions, then mark together. The patterns repeat every year.",
      isAccepted: true,
    },
    {
      topicId: topic1[0].id,
      userId: teacher3[0].id,
      content: "I also make one-page formula sheets they stick on the wall. Works wonders.",
    },
  ]);

  const topic2 = await db
    .insert(forumTopics)
    .values({
      userId: teacher3[0].id,
      title: "Tips for teaching Luganda to non-native primary pupils?",
      body: "I have several pupils whose first language isn't Luganda. Songs and games help — what has worked for you?",
      subject: "luganda",
      level: "primary",
      views: 89,
    })
    .returning();

  await db.insert(forumReplies).values([
    {
      topicId: topic2[0].id,
      userId: mwalimu[0].id,
      content:
        "Role-play greetings every morning. Children pick it up fast when it's part of the routine rather than a 'lesson'.",
      isAccepted: false,
    },
  ]);

  // ---- Tips -----------------------------------------------------------
  await db.insert(tips).values([
    {
      fromUserId: teacher2[0].id,
      toUserId: mwalimu[0].id,
      amount: 5000,
      network: "mtn",
      message: "Thanks for the Physics papers! Lifesavers.",
    },
    {
      fromUserId: teacher3[0].id,
      toUserId: mwalimu[0].id,
      amount: 2000,
      network: "airtel",
      message: "Keep up the good work 💚",
    },
  ]);

  seeded = true;
}
