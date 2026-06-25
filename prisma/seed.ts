import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.auditLog.deleteMany()
  await prisma.testAnswer.deleteMany()
  await prisma.testAttempt.deleteMany()
  await prisma.certificate.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.lessonProgress.deleteMany()
  await prisma.answerOption.deleteMany()
  await prisma.question.deleteMany()
  await prisma.test.deleteMany()
  await prisma.material.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.courseAssignment.deleteMany()
  await prisma.course.deleteMany()
  await prisma.section.deleteMany()
  await prisma.user.deleteMany()
  await prisma.platformSettings.deleteMany()

  const hash = async (pw: string) => bcrypt.hash(pw, 12)

  const admin = await prisma.user.create({
    data: {
      login: 'admin',
      passwordHash: await hash('Admin123!'),
      fullName: 'Администратор Системы',
      firstName: 'Админ',
      initials: 'АД',
      department: 'Астана',
      role: 'ADMIN',
    },
  })

  const methodist = await prisma.user.create({
    data: {
      login: 'methodist',
      passwordHash: await hash('Method123!'),
      fullName: 'Контент Менеджер',
      firstName: 'Методист',
      initials: 'КМ',
      department: 'Алматы',
      role: 'METHODIST',
    },
  })

  const manager = await prisma.user.create({
    data: {
      login: 'manager',
      passwordHash: await hash('Manager123!'),
      fullName: 'Руководитель Подразделения',
      firstName: 'Руководитель',
      initials: 'РП',
      department: 'Алматы',
      role: 'MANAGER',
    },
  })

  const employee = await prisma.user.create({
    data: {
      login: 'asxhat',
      passwordHash: await hash('Employee123!'),
      fullName: 'Ахметов А.Б.',
      firstName: 'Асхат',
      initials: 'АА',
      department: 'Алматы',
      role: 'EMPLOYEE',
    },
  })

  const employees = await prisma.user.createMany({
    data: [
      { login: 'seitkali', passwordHash: await hash('Employee123!'), fullName: 'Сейткали М.', firstName: 'Сейткали', initials: 'СМ', department: 'Астана', role: 'EMPLOYEE' },
      { login: 'dosov', passwordHash: await hash('Employee123!'), fullName: 'Досов Р.', firstName: 'Досов', initials: 'ДР', department: 'Шымкент', role: 'EMPLOYEE' },
      { login: 'nurova', passwordHash: await hash('Employee123!'), fullName: 'Нурова А.', firstName: 'Нурова', initials: 'НА', department: 'Шымкент', role: 'EMPLOYEE' },
      { login: 'kairov', passwordHash: await hash('Employee123!'), fullName: 'Каиров Б.', firstName: 'Каиров', initials: 'КБ', department: 'Актобе', role: 'EMPLOYEE' },
    ],
  })

  void admin
  void methodist
  void manager
  void employees

  const allEmployees = await prisma.user.findMany({ where: { role: 'EMPLOYEE' } })

  await prisma.platformSettings.create({ data: { id: 'default' } })

  const sectionSafety = await prisma.section.create({
    data: {
      nameRu: 'Основы экологической безопасности',
      nameKk: 'Экологиялық қауipсіздіктің негіздері',
      order: 1,
    },
  })

  const sectionWater = await prisma.section.create({
    data: {
      nameRu: 'Водные ресурсы',
      nameKk: 'Су ресурстары',
      order: 2,
    },
  })

  const sectionWaste = await prisma.section.create({
    data: {
      nameRu: 'Управление отходами',
      nameKk: 'Қалдықтарды басқaru',
      order: 3,
    },
  })

  const courseSafety = await prisma.course.create({
    data: {
      sectionId: sectionSafety.id,
      slug: 'safety',
      titleRu: 'Основы экологической безопасности',
      titleKk: 'Экологиялық қauipсізdiktің negіzderі',
      thumbColor: 'green',
      icon: 'ti-leaf',
      iconColor: '#1a5c38',
      order: 1,
    },
  })

  const courseWater = await prisma.course.create({
    data: {
      sectionId: sectionWater.id,
      slug: 'water',
      titleRu: 'Управление водными ресурсами',
      titleKk: 'Су ресурстарын basqaru',
      thumbColor: 'blue',
      icon: 'ti-droplet',
      iconColor: '#185fa5',
      order: 1,
    },
  })

  const courseWaste = await prisma.course.create({
    data: {
      sectionId: sectionWaste.id,
      slug: 'waste',
      titleRu: 'Обращение с отходами',
      titleKk: 'Қалдықтармен жұmys',
      thumbColor: 'amber',
      icon: 'ti-flame',
      iconColor: '#854f0b',
      order: 1,
    },
  })

  for (const emp of allEmployees) {
    for (const course of [courseSafety, courseWater, courseWaste]) {
      await prisma.courseAssignment.create({
        data: { userId: emp.id, courseId: course.id },
      })
    }
  }

  // Safety course - 8 lessons, all completed for asxhat
  for (let i = 1; i <= 8; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        courseId: courseSafety.id,
        titleRu: `Урок ${i} — Экобезопасность`,
        titleKk: `${i}-сабақ — Экoқauipsizdik`,
        order: i,
        durationSec: 300,
      },
    })
    await createLessonWithTest(lesson.id, i === 1)
  }

  // Water course - 6 lessons
  const waterLessons = []
  for (let i = 1; i <= 6; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        courseId: courseWater.id,
        titleRu: i === 3 ? 'Мониторинг сточных вод' : `Урок ${i} — Водные ресурсы`,
        titleKk: i === 3 ? 'Ағын суды мониторингтеу' : `${i}-сабaq — Су ресурстары`,
        order: i,
        durationSec: i === 3 ? 754 : 480,
      },
    })
    waterLessons.push(lesson)
    const test = await createLessonWithTest(lesson.id, i === 3)

    if (i === 3) {
      await prisma.question.create({
        data: {
          testId: test.id,
          type: 'SINGLE',
          textRu: 'Какой показатель используется для оценки качества сточных вод?',
          textKk: 'Ағын су сапасын бағалау үшін қандай көрсетkіsh қолданылады?',
          order: 1,
          options: {
            create: [
              { textRu: 'Температура воды', textKk: 'Су температурасы', isCorrect: false, order: 1 },
              { textRu: 'БПК (биохимическое потребление кислорода)', textKk: 'БОК (биохимиялық оттегін тұтыну)', isCorrect: true, order: 2 },
              { textRu: 'Скорость течения', textKk: 'Ағын жылдамдығы', isCorrect: false, order: 3 },
              { textRu: 'Цвет воды', textKk: 'Су түсі', isCorrect: false, order: 4 },
            ],
          },
        },
      })
    }
  }

  // Mark safety complete + water partial for asxhat
  const safetyLessons = await prisma.lesson.findMany({ where: { courseId: courseSafety.id } })
  for (const l of safetyLessons) {
    await prisma.lessonProgress.create({
      data: { userId: employee.id, lessonId: l.id, videoWatched: true, materialsViewed: true, completed: true },
    })
  }

  await prisma.certificate.create({
    data: { userId: employee.id, courseId: courseSafety.id },
  })

  for (const l of waterLessons.slice(0, 2)) {
    await prisma.lessonProgress.create({
      data: { userId: employee.id, lessonId: l.id, videoWatched: true, materialsViewed: true, completed: true },
    })
  }

  await prisma.testAttempt.create({
    data: {
      userId: employee.id,
      testId: (await prisma.test.findFirst({ where: { lessonId: waterLessons[0]!.id } }))!.id,
      score: 87,
      passed: true,
      finishedAt: new Date('2026-06-03'),
    },
  })

  // Waste - not started
  for (let i = 1; i <= 5; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        courseId: courseWaste.id,
        titleRu: `Урок ${i} — Отходы`,
        titleKk: `${i}-сабaq — Қалдықтар`,
        order: i,
        durationSec: 300,
      },
    })
    await createLessonWithTest(lesson.id, false)
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: employee.id,
        titleRu: 'Необходимо пройти обучение',
        titleKk: 'Оқытуды өту қажет',
        messageRu: 'Курс «Обращение с отходами» должен быть завершён до 30 июня 2026',
        messageKk: '«Қалдықтармен жұmys» kursy 2026 jylgy 30 mausymga deyin ayaqtaluы tıis',
      },
      {
        userId: employee.id,
        titleRu: 'Тест доступен',
        titleKk: 'Тест қолжетімді',
        messageRu: 'Вы можете пройти тест по курсу «Управление водными ресурсами»',
        messageKk: '«Су ресурстарын basqaru» kursy boyynsha testten ötuge bolady',
      },
      {
        userId: employee.id,
        titleRu: 'Сертификат готов',
        titleKk: 'Сертификат дайын',
        messageRu: 'Сертификат по курсу «Основы экологической безопасности» доступен для скачивания',
        messageKk: '«Экологиялық қauipсізdiktің negіzderі» kursy boyynsha sertifikat júkteuge qoljetimdi',
      },
    ],
  })

  console.log('Seed complete.')
  console.log('Demo accounts:')
  console.log('  admin / Admin123!')
  console.log('  methodist / Method123!')
  console.log('  manager / Manager123!')
  console.log('  asxhat / Employee123!')
}

async function createLessonWithTest(lessonId: string, withDefaultQuestion: boolean) {
  await prisma.material.create({
    data: {
      lessonId,
      type: 'PDF',
      titleRu: 'Учебный материал',
      titleKk: 'Оқу материалы',
      fileName: 'material.pdf',
    },
  })

  const test = await prisma.test.create({
    data: {
      lessonId,
      passScore: 70,
      maxAttempts: 3,
      timeLimitMin: 30,
      questionsToShow: 5,
    },
  })

  if (withDefaultQuestion) {
    await prisma.question.create({
      data: {
        testId: test.id,
        type: 'SINGLE',
        textRu: 'Какой показатель используется для оценки качества сточных вод?',
        textKk: 'Ағын су сапасын бағalaу үшін қanдай көрсетkіsh қолданылады?',
        order: 1,
        options: {
          create: [
            { textRu: 'Температура воды', textKk: 'Су температурасы', isCorrect: false, order: 1 },
            { textRu: 'БПК (биохимическое потребление кислорода)', textKk: 'БОК (биохимиялық оттegін тұтыну)', isCorrect: true, order: 2 },
            { textRu: 'Скорость течения', textKk: 'Ағын жылдамдығы', isCorrect: false, order: 3 },
            { textRu: 'Цвет воды', textKk: 'Су түсі', isCorrect: false, order: 4 },
          ],
        },
      },
    })
  }

  return test
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
