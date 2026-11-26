import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen, CheckCircle2, XCircle, Clock, Award, BarChart3,
  ShieldCheck, Users, Plus, Pencil, Trash2, Download, Upload, Search,
  ChevronLeft, ChevronRight, RotateCcw, AlertTriangle, Check, Copy,
  GraduationCap, Layers, FileSpreadsheet, Menu, X, Eye,
  Sparkles, Filter, ClipboardCheck, ArrowRight, Play, HelpCircle,
  Lock, LogOut, UserCheck, KeyRound, Cloud, Globe, TrendingUp, UserPlus
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';

// ============================================================================
// DATA MODEL (Supabase / PostgreSQL + localStorage gibrid arxitektura)
// ============================================================================
export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionCategory = 'theory' | 'terms' | 'code_analysis' | 'bug_finding' | 'practical';
export type QuestionType = 'mcq' | 'open';
export type UserRole = 'student' | 'mentor';

export interface UserAccount {
  id: string;
  fullName: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  groupName?: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  order: number;
  title: string;
  shortTitle: string;
  description: string;
  technologies: string[];
}

export interface Question {
  id: string;
  topicId: string;
  sourceTopicId?: string;
  type: QuestionType;
  difficulty: Difficulty;
  category: QuestionCategory;
  text: string;
  code?: string;
  options?: { A: string; B: string; C: string; D: string };
  correctOption?: 'A' | 'B' | 'C' | 'D';
  acceptedAnswers?: string[];
  requiresMentorReview?: boolean;
  explanation: string;
  codeExplanation?: string;
}

export interface QuestionResult {
  questionId: string;
  userAnswer: string;
  status: 'correct' | 'wrong' | 'unanswered' | 'pending_review';
  score: number;
  mentorReviewed?: boolean;
}

export interface Attempt {
  id: string;
  studentId: string;
  studentName: string;
  studentGroup?: string;
  topicId: string;
  topicTitle: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  totalQuestions: number;
  score: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  pendingReviewCount: number;
  isProvisional: boolean;
  isRetryMode?: boolean;
  results: QuestionResult[];
}

export interface CloudConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  enabled: boolean;
}

// Lightweight deterministic hash for local demo accounts (Supabase Auth / bcrypt is used in production)
function simpleHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `h_${(h >>> 0).toString(16)}`;
}

// ============================================================================
// DEFAULT ACCOUNTS (O‘quvchilar va Mentor uchun alohida kirish ma’lumotlari)
// ============================================================================
const INITIAL_USERS: UserAccount[] = [
  {
    id: 'mentor-1',
    fullName: 'Bosh Mentor (DRF)',
    username: 'mentor',
    passwordHash: simpleHash('mentor2026'),
    role: 'mentor',
    createdAt: '2026-09-01T09:00:00.000Z'
  },
  {
    id: 'student-1',
    fullName: 'Azizbek Karimov',
    username: 'azizbek',
    passwordHash: simpleHash('123456'),
    role: 'student',
    groupName: 'DRF-2026-A',
    createdAt: '2026-09-02T09:00:00.000Z'
  },
  {
    id: 'student-2',
    fullName: 'Madina Rahimova',
    username: 'madina',
    passwordHash: simpleHash('123456'),
    role: 'student',
    groupName: 'DRF-2026-A',
    createdAt: '2026-09-02T09:15:00.000Z'
  },
  {
    id: 'student-3',
    fullName: 'Javohir Tursunov',
    username: 'javohir',
    passwordHash: simpleHash('123456'),
    role: 'student',
    groupName: 'DRF-2026-B',
    createdAt: '2026-09-02T09:30:00.000Z'
  }
];

// ============================================================================
// INITIAL TOPICS (9 ta mavzu)
// ============================================================================
const INITIAL_TOPICS: Topic[] = [
  {
    id: 'topic-1',
    order: 1,
    title: '1-MAVZU. Django REST Framework. SSR va CSR',
    shortTitle: 'DRF, SSR va CSR',
    description: 'REST arxitekturasi asoslari, Server Side Rendering va Client Side Rendering yondashuvlari hamda backend-frontend ma’lumot almashinuvi.',
    technologies: [
      'Django REST Framework haqida umumiy tushuncha',
      'REST arxitektura prinsiplari',
      'Server Side Rendering (SSR)',
      'Client Side Rendering (CSR)',
      'SSR va CSR o‘rtasidagi farqlar',
      'Backend va frontend o‘rtasidagi ma’lumot almashinuvi'
    ]
  },
  {
    id: 'topic-2',
    order: 2,
    title: '2-MAVZU. DRF loyihasini qurish va ma’lumotlar bazasini loyihalash',
    shortTitle: 'Loyiha qurish va DB Design',
    description: 'Django va DRF ni o‘rnatish, settings.py bazaviy konfiguratsiyasi, relyatsion ma’lumotlar bazasini loyihalash va PostgreSQL bilan bog‘lash.',
    technologies: [
      'Database Design',
      'Django loyihasini yaratish',
      'Django REST Framework o‘rnatish',
      'Bazaviy konfiguratsiya',
      'settings.py sozlamalari',
      'PostgreSQL bilan bog‘lash',
      'Ma’lumotlar bazasi konfiguratsiyasi'
    ]
  },
  {
    id: 'topic-3',
    order: 3,
    title: '3-MAVZU. Model, View, Serializer va Routerlar',
    shortTitle: 'Model, View, Serializer, Router',
    description: 'Django modellari, Serializer va ModelSerializer, APIView, GenericAPIView, ViewSet va Routerlar o‘rtasidagi to‘liq arxitektura bog‘liqligi.',
    technologies: [
      'Model tushunchasi va yaratish',
      'Serializer',
      'ModelSerializer',
      'APIView',
      'GenericAPIView',
      'ViewSet',
      'Routerlar',
      'View, Serializer va Router o‘rtasidagi bog‘liqlik'
    ]
  },
  {
    id: 'topic-4',
    order: 4,
    title: '4-MAVZU. Foydalanuvchilarni boshqarish va autentifikatsiya',
    shortTitle: 'Autentifikatsiya va JWT',
    description: 'Identifikatsiya, autentifikatsiya va avtorizatsiya, Custom User Model, Session, Token va JWT autentifikatsiya mexanizmlari.',
    technologies: [
      'Identifikatsiya',
      'Autentifikatsiya',
      'Avtorizatsiya',
      'Custom User Model',
      'Session authentication',
      'Token authentication',
      'JWT authentication',
      'JSON Web Token tuzilishi',
      'Permissions va foydalanuvchi ruxsatlari'
    ]
  },
  {
    id: 'topic-5',
    order: 5,
    title: '5-MAVZU. Ruxsatlar bilan ishlash (Permissions)',
    shortTitle: 'Permissions tizimi',
    description: 'DRF permission arxitekturasi, standart ruxsat klasslari, object-level va custom permissions, has_permission() hamda has_object_permission().',
    technologies: [
      'Permissions tushunchasi',
      'Authentication va Permission farqi',
      'DRF permission arxitekturasi',
      'AllowAny / IsAuthenticated / IsAdminUser / IsAuthenticatedOrReadOnly',
      'DEFAULT_PERMISSION_CLASSES',
      'Object-level permissions',
      'Custom permissions (has_permission, has_object_permission)',
      'View va ViewSet uchun ruxsatlarni sozlash',
      'Turli endpointlar uchun alohida ruxsatlar'
    ]
  },
  {
    id: 'topic-6',
    order: 6,
    title: '6-MAVZU. Filtrlash, qidiruv va tartiblash',
    shortTitle: 'Filtering, Search, Ordering',
    description: 'django-filter, FilterSet, DjangoFilterBackend, SearchFilter, OrderingFilter va murakkab URL query parametrlari bilan ishlash.',
    technologies: [
      'Filtering va django-filter kutubxonasi',
      'FilterSet va DjangoFilterBackend',
      'SearchFilter va search_fields',
      'OrderingFilter va ordering_fields',
      'filter_backends',
      'URL query parameters',
      'Bir nechta filtrni birgalikda ishlatish'
    ]
  },
  {
    id: 'topic-7',
    order: 7,
    title: '7-MAVZU. Pagination va Throttling',
    shortTitle: 'Pagination va Throttling',
    description: 'PageNumber, LimitOffset, Cursor va Custom pagination turlari, shuningdek AnonRate, UserRate, ScopedRate va Custom throttling sozlamalari.',
    technologies: [
      'Pagination tushunchasi',
      'PageNumberPagination',
      'LimitOffsetPagination',
      'CursorPagination va Custom pagination',
      'Throttling tushunchasi',
      'AnonRateThrottle / UserRateThrottle / ScopedRateThrottle',
      'Custom throttling',
      'DEFAULT_THROTTLE_CLASSES va DEFAULT_THROTTLE_RATES'
    ]
  },
  {
    id: 'topic-8',
    order: 8,
    title: '8-MAVZU. Statik va media fayllar bilan ishlash',
    shortTitle: 'Static va Media fayllar',
    description: 'STATIC/MEDIA sozlamalari, FileField va ImageField, multipart/form-data orqali fayl qabul qilish, validatsiya va xavfsiz yuklab olish.',
    technologies: [
      'Static files va Media files',
      'MEDIA_ROOT / MEDIA_URL / STATIC_ROOT / STATIC_URL',
      'FileField va ImageField',
      'Serializer orqali fayl qabul qilish',
      'Fayl validatsiyasi',
      'Fayllarni yuklash va yuklab olish',
      'Multipart/form-data'
    ]
  },
  {
    id: 'topic-9',
    order: 9,
    title: '9-MAVZU. API testlash va hujjatlashtirish',
    shortTitle: 'API Testing va Hujjatlashtirish',
    description: 'APITestCase, APIClient, pytest va pytest-django yordamida endpointlarni avtomatik testlash, Postman, Swagger va ReDoc orqali hujjatlashtirish.',
    technologies: [
      'API testing va DRF test muhiti',
      'APITestCase va APIClient',
      'pytest va pytest-django',
      'Postman',
      'Swagger va ReDoc',
      'API hujjatlashtirish',
      'Endpointlar va HTTP status kodlarini tekshirish'
    ]
  }
];

const INITIAL_QUESTIONS: Question[] = [
  {
    "id": "t1-q1",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "Django REST Framework (DRF) loyihada asosan qaysi vazifani bajaradi?",
    "options": {
      "A": "RESTful Web API yaratishni soddalashtiradi",
      "B": "HTML shablonlarni brauzerda chizadi",
      "C": "PostgreSQL bazasini avtomatik o‘rnatadi",
      "D": "CSS uslublarini kompilyatsiya qiladi"
    },
    "correctOption": "A",
    "explanation": "Django REST Framework — Django asosida RESTful Web API yaratish uchun mo‘ljallangan kuchli kutubxona bo‘lib, serializatsiya, autentifikatsiya va view tizimini taqdim etadi."
  },
  {
    "id": "t1-q2",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "REST arxitekturasida 'Stateless' (holatsiz) prinsipi nimani anglatadi?",
    "options": {
      "A": "Mijoz faqat GET so‘rovlarini yuborishi mumkin",
      "B": "Ma'lumotlar bazasi faqat vaqtinchalik xotirada ishlaydi",
      "C": "Server har bir so‘rovni alohida mustaqil qayta ishlaydi",
      "D": "Server barcha foydalanuvchi sessiyalarini xotirada saqlaydi"
    },
    "correctOption": "C",
    "explanation": "Stateless prinsipiga ko‘ra, mijozdan kelgan har bir HTTP so‘rov o‘zida uni qayta ishlash uchun zarur barcha ma'lumotni (masalan, tokenni) saqlaydi; server mijoz holatini saqlamaydi."
  },
  {
    "id": "t1-q3",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "Server Side Rendering (SSR) yondashuvida HTML sahifa qayerda shakllantiriladi?",
    "options": {
      "A": "Server tomonida har bir so‘rovda",
      "B": "Foydalanuvchi brauzerida JavaScript orqali",
      "C": "Mobil ilovaning lokal keshida",
      "D": "CDN tarmog‘idagi DNS serverida"
    },
    "correctOption": "A",
    "explanation": "SSR (Server Side Rendering) da server ma'lumotlarni bazadan olib, tayyor HTML hujjatni shakllantiradi va brauzerga yuboradi."
  },
  {
    "id": "t1-q4",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "Client Side Rendering (CSR) arxitekturasida backend server mijozga odatda qaysi formatda ma'lumot qaytaradi?",
    "options": {
      "A": "Tayyor HTML va CSS fayllar to‘plamini",
      "B": "Siqilgan binar bajariluvchi faylni",
      "C": "JSON ko‘rinishidagi strukturali ma'lumotni",
      "D": "To‘g‘ridan-to‘g‘ri SQL so‘rovlar natijasini"
    },
    "correctOption": "C",
    "explanation": "CSR da backend (masalan, DRF) faqat ma'lumotni JSON formatida uzatadi, UI ni esa frontend (React, Vue, Angular) brauzerda chizadi."
  },
  {
    "id": "t1-q5",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "HTTP protokolida mavjud resursni to‘liq yangilash uchun qaysi metod qo‘llaniladi?",
    "options": {
      "A": "GET",
      "B": "PUT",
      "C": "HEAD",
      "D": "OPTIONS"
    },
    "correctOption": "B",
    "explanation": "PUT metodi mavjud resursni to‘liq yangilash (almashtirish) uchun ishlatiladi, PATCH esa qisman yangilash uchun xizmat qiladi."
  },
  {
    "id": "t1-q6",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "REST API da resurs muvaffaqiyatli yaratilganda qaysi HTTP status kodi qaytarilishi maqsadga muvofiq?",
    "options": {
      "A": "200 OK",
      "B": "204 No Content",
      "C": "201 Created",
      "D": "302 Found"
    },
    "correctOption": "C",
    "explanation": "POST so‘rovi orqali yangi resurs muvaffaqiyatli yaratilganda 201 Created status kodini qaytarish REST standartiga mos keladi."
  },
  {
    "id": "t1-q7",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "SSR yondashuvining CSR ga nisbatan asosiy ustunliklaridan biri qaysi?",
    "options": {
      "A": "Serverga tushadigan yuklamaning nolga tengligi",
      "B": "Sahifalar o‘rtasida umuman so‘rov ketmasligi",
      "C": "Qidiruv tizimlari (SEO) uchun qulayligi",
      "D": "JavaScript fayllarining umuman ishlatilmasligi"
    },
    "correctOption": "C",
    "explanation": "SSR tayyor HTML qaytargani sababli qidiruv tizimi botlari (Googlebot va boshqalar) sahifa kontentini darhol va to‘liq indekslay oladi."
  },
  {
    "id": "t1-q8",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "easy",
    "category": "practical",
    "text": "Bir vaqtning o‘zida veb-sayt, iOS va Android ilovalari uchun yagona backend kerak bo‘lsa, qaysi yondashuv eng to‘g‘ri?",
    "options": {
      "A": "Faqat Django HTML shablonlaridan foydalanish",
      "B": "DRF yordamida yagona REST API yaratish",
      "C": "Har bir platforma uchun alohida baza ochish",
      "D": "Statik HTML fayllarni serverga yuklash"
    },
    "correctOption": "B",
    "explanation": "REST API JSON ma'lumot qaytargani uchun veb-frontend, Android va iOS mijozlari bitta umumiy backend bilan ishlay oladi."
  },
  {
    "id": "t1-q9",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi Django va DRF view kodi qanday turdagi javob qaytaradi?",
    "code": "from rest_framework.decorators import api_view\nfrom rest_framework.response import Response\n\n@api_view(['GET'])\ndef ping(request):\n    return Response({'status': 'ok', 'code': 200})",
    "options": {
      "A": "JSON formatidagi API javobini qaytaradi",
      "B": "Django HTML shablonini render qiladi",
      "C": "Plain text ko‘rinishidagi satr qaytaradi",
      "D": "Redirect orqali boshqa sahifaga o‘tkazadi"
    },
    "correctOption": "A",
    "explanation": "DRF ning Response obyekti mijozning Accept sarlavhasiga qarab ma'lumotni JSON (yoki Browsable API) formatida render qiladi.",
    "codeExplanation": "@api_view(['GET']) dekoratori funksiyani DRF view ga aylantiradi va Response lug‘atni JSON ko‘rinishida qaytaradi."
  },
  {
    "id": "t1-q10",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi kod qaysi renderlash arxitekturasiga misol bo‘ladi?",
    "code": "from django.shortcuts import render\nfrom .models import Course\n\ndef course_list(request):\n    courses = Course.objects.all()\n    return render(request, 'courses/list.html', {'courses': courses})",
    "options": {
      "A": "WebSocket Streaming",
      "B": "Client Side Rendering (CSR)",
      "C": "GraphQL Subscription",
      "D": "Server Side Rendering (SSR)"
    },
    "correctOption": "D",
    "explanation": "Django render() funksiyasi serverda courses/list.html shablonini kontekst ma'lumotlari bilan birlashtirib tayyor HTML qaytaradi — bu SSR dir.",
    "codeExplanation": "render(request, template_name, context) HTML sahifani server tomonida hosil qiladi."
  },
  {
    "id": "t1-q11",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi frontend so‘rovi qaysi backend metodini va qanday ma'lumot formatini kutmoqda?",
    "code": "fetch('https://api.drfacademy.uz/api/v1/courses/', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ title: 'DRF Asoslari', price: 0 })\n})",
    "options": {
      "A": "GET so‘rovi va form-data formatini",
      "B": "PUT so‘rovi va XML formatini",
      "C": "POST so‘rovi va JSON formatini",
      "D": "DELETE so‘rovi va matn formatini"
    },
    "correctOption": "C",
    "explanation": "method: 'POST' yangi yozuv yaratishni, Content-Type: 'application/json' va JSON.stringify() esa JSON tana yuborilayotganini bildiradi.",
    "codeExplanation": "Frontend CSR ilovasi DRF endpointiga JSON ko‘rinishida POST so‘rov jo‘natmoqda."
  },
  {
    "id": "t1-q12",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi DRF view funksiyasida qanday xato mavjud?",
    "code": "from rest_framework.response import Response\n\ndef get_student(request):\n    return Response({'name': 'Aziz'})",
    "options": {
      "A": "Response o‘rniga JsonResponse shart",
      "B": "request parametri ortiqcha berilgan",
      "C": "Lug‘at kalitlari katta harfda bo‘lishi kerak",
      "D": "@api_view dekoratori yozilmagan"
    },
    "correctOption": "D",
    "explanation": "Oddiy Django view funksiyasi ichida DRF Response qaytarilsa, accepted_renderer aniqlanmagani sababli AssertionError yuzaga keladi; @api_view dekoratori zarur.",
    "codeExplanation": "@api_view(['GET']) dekoratori DRF Request/Response mexanizmini va rendererlarni ulaydi."
  },
  {
    "id": "t1-q13",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi REST endpoint dizaynida RESTful tamoyiliga zid jihat qaysi?",
    "code": "POST /api/getAllStudents/\nGET  /api/deleteStudentById/5/",
    "options": {
      "A": "Talaba ID si raqam ko‘rinishida berilgan",
      "B": "URL ichida fe'llar va noto‘g‘ri HTTP metodlar ishlatilgan",
      "C": "URL oxirida slash (/) belgisi qo‘yilgan",
      "D": "Endpointlar /api/ prefiksi bilan boshlangan"
    },
    "correctOption": "B",
    "explanation": "REST da URL lar resursni (ot shaklida, masalan /api/students/5/) bildirishi, amal esa HTTP metod (GET, POST, DELETE) orqali ifodalanishi kerak.",
    "codeExplanation": "O‘chirish uchun GET emas DELETE /api/students/5/, ro‘yxat olish uchun POST emas GET /api/students/ ishlatiladi."
  },
  {
    "id": "t1-q14",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "medium",
    "category": "terms",
    "text": "REST arxitekturasida 'Uniform Interface' (yagona interfeys) nimani ta'minlaydi?",
    "options": {
      "A": "Faqat bitta dasturlash tilida kod yozishni",
      "B": "Ma'lumotlar bazasida faqat bitta jadval bo‘lishini",
      "C": "Barcha sahifalarda bir xil ranglar palitrasini",
      "D": "Barcha mijozlar bilan standartlashtirilgan qoidada muloqotni"
    },
    "correctOption": "D",
    "explanation": "Uniform Interface mijoz va server o‘rtasidagi aloqani standart HTTP metodlar, URI resurslar va aniq media turlari orqali birxillashtiradi."
  },
  {
    "id": "t1-q15",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi view funksiyasiga POST so‘rovi yuborilsa, DRF qaysi HTTP status kodini qaytaradi?",
    "code": "@api_view(['GET'])\ndef book_list(request):\n    return Response([{'id': 1, 'title': 'Django'}])",
    "options": {
      "A": "400 Bad Request",
      "B": "405 Method Not Allowed",
      "C": "401 Unauthorized",
      "D": "404 Not Found"
    },
    "correctOption": "B",
    "explanation": "@api_view(['GET']) faqat GET metodiga ruxsat bergani uchun POST so‘rovi yuborilganda DRF avtomatik 405 Method Not Allowed qaytaradi.",
    "codeExplanation": "Ruxsat etilgan metodlar ro‘yxatida POST yo‘q, shu bois 405 status kodi qaytadi."
  },
  {
    "id": "t1-q16",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "React frontend (localhost:5173) DRF backend (localhost:8000) ga so‘rov yuborganda brauzer bloklasa, bu qaysi mexanizm bilan bog‘liq?",
    "options": {
      "A": "CSRF token muddati tugashi",
      "B": "CORS (Cross-Origin Resource Sharing) siyosati",
      "C": "SQL injeksiya himoyasi",
      "D": "DNS keshining to‘lib qolishi"
    },
    "correctOption": "B",
    "explanation": "Turli port yoki domenlar o‘rtasida brauzer so‘rovlarini ruxsat etish uchun DRF da django-cors-headers orqali CORS sozlanishi kerak."
  },
  {
    "id": "t1-q17",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "medium",
    "category": "theory",
    "text": "CSR ilovasida birinchi yuklanish (First Contentful Paint) nega SSR ga qaraganda sekinroq bo‘lishi mumkin?",
    "options": {
      "A": "Server har safar bazani qayta ishga tushiradi",
      "B": "HTML fayl ichida barcha rasmlar joylashadi",
      "C": "Brauzer avval JavaScript paketini yuklab ishga tushiradi",
      "D": "CSR da HTTP/2 protokoli ishlamaydi"
    },
    "correctOption": "C",
    "explanation": "CSR da brauzer dastlab bo‘sh HTML va katta JS bundle ni yuklaydi, uni bajaradi va so‘ngra API dan ma'lumot olib sahifani chizadi."
  },
  {
    "id": "t1-q18",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi DRF view funksiyasi qaysi status kodi bilan javob qaytaradi?",
    "code": "from rest_framework import status\nfrom rest_framework.decorators import api_view\nfrom rest_framework.response import Response\n\n@api_view(['DELETE'])\ndef remove_item(request, pk):\n    return Response(status=status.HTTP_204_NO_CONTENT)",
    "options": {
      "A": "204 No Content va bo‘sh tana",
      "B": "200 OK va JSON xabar",
      "C": "201 Created va obyekt ID si",
      "D": "404 Not Found va xato matni"
    },
    "correctOption": "A",
    "explanation": "Response(status=status.HTTP_204_NO_CONTENT) muvaffaqiyatli o‘chirish amalini bildirib, javob tanasisiz 204 statusini qaytaradi.",
    "codeExplanation": "status.HTTP_204_NO_CONTENT konstantasining qiymati 204 ga teng."
  },
  {
    "id": "t1-q19",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi kodda DRF request dan JSON ma'lumot o‘qishda qanday muammo bor?",
    "code": "@api_view(['POST'])\ndef create_note(request):\n    title = request.POST['title']\n    return Response({'title': title})",
    "options": {
      "A": "POST metodida request obyekti mavjud bo‘lmaydi",
      "B": "Response ichida lug‘at qaytarib bo‘lmaydi",
      "C": "title o‘zgaruvchisi int turida bo‘lishi shart",
      "D": "request.POST JSON tanani o‘qimaydi, request.data kerak"
    },
    "correctOption": "D",
    "explanation": "Django ning request.POST faqat form-encoded ma'lumotlarni o‘qiydi; JSON so‘rov tanasi uchun DRF ning request.data atributidan foydalanish kerak.",
    "codeExplanation": "Mijoz application/json yuborganda request.POST bo‘sh qoladi va KeyError beradi."
  },
  {
    "id": "t1-q20",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "Yangiliklar portali uchun Google qidiruvida yuqori o‘rin va tez dastlabki ochilish eng muhim bo‘lsa, qaysi renderlash afzal?",
    "options": {
      "A": "Faqat sof CSR yondashuvi",
      "B": "Faqat WebSocket orqali yuklash",
      "C": "Lokal SQLite brauzer rejimi",
      "D": "SSR yoki statik generatsiya (SSG)"
    },
    "correctOption": "D",
    "explanation": "Kontentga boy va SEO muhim saytlar uchun SSR/SSG tayyor HTML qaytargani bois tez ochilish va yaxshi indekslashni ta'minlaydi."
  },
  {
    "id": "t1-q21",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Mijoz 'Accept: text/html' sarlavhasi bilan DRF endpointiga GET so‘rovi yuborsa, standart sozlamada nima qaytadi?",
    "code": "GET /api/courses/ HTTP/1.1\nHost: api.example.com\nAccept: text/html",
    "options": {
      "A": "DRF Browsable API HTML sahifasi",
      "B": "406 Not Acceptable xatosi",
      "C": "Faqat xom JSON matni",
      "D": "XML formatidagi ma'lumot"
    },
    "correctOption": "A",
    "explanation": "DRF da standart DEFAULT_RENDERER_CLASSES ichida JSONRenderer va BrowsableAPIRenderer bo‘ladi; Accept: text/html kelganda Browsable API qaytadi.",
    "codeExplanation": "Content negotiation mexanizmi Accept sarlavhasiga mos rendererni tanlaydi."
  },
  {
    "id": "t1-q22",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Quyidagi HTTP metodlardan qaysi biri idempotent hisoblanadi, lekin 'safe' (xavfsiz) emas?",
    "code": "GET /api/items/1/\nPOST /api/items/\nPUT /api/items/1/\nHEAD /api/items/1/",
    "options": {
      "A": "GET",
      "B": "PUT",
      "C": "POST",
      "D": "HEAD"
    },
    "correctOption": "B",
    "explanation": "PUT server holatini o‘zgartiradi (shuning uchun safe emas), lekin bir xil PUT so‘rovini qayta-qayta yuborish bir xil natija beradi (idempotent).",
    "codeExplanation": "GET va HEAD ham safe, ham idempotent; POST ikkalasi ham emas; PUT va DELETE esa idempotent, ammo safe emas."
  },
  {
    "id": "t1-q23",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "hard",
    "category": "bug_finding",
    "text": "Quyidagi DRF view kodida 'name' kaliti kelmasa qanday xato yuz beradi?",
    "code": "@api_view(['POST'])\ndef greet(request):\n    name = request.data['name']\n    return Response({'msg': f'Salom, {name}'})",
    "options": {
      "A": "KeyError istisnosi va 500 xato chiqadi",
      "B": "name o‘zgaruvchisi None bo‘lib qoladi",
      "C": "DRF bo‘sh satr bilan davom etadi",
      "D": "400 Bad Request avtomatik qaytadi"
    },
    "correctOption": "A",
    "explanation": "request.data['name'] orqali to‘g‘ridan-to‘g‘ri murojaat qilinganda kalit bo‘lmasa KeyError chiqadi; request.data.get('name') yoki Serializer ishlatish xavfsizroq.",
    "codeExplanation": "Kalit topilmaganda Python KeyError tashlaydi, bu esa qayta ishlanmasa 500 Internal Server Error ga olib keladi."
  },
  {
    "id": "t1-q24",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "Production muhitida DRF Browsable API ni o‘chirib, faqat JSON javob qaytarish uchun qaysi sozlama o‘zgartiriladi?",
    "options": {
      "A": "ALLOWED_HOSTS ichidan domen o‘chiriladi",
      "B": "DEBUG = True qilib belgilab qo‘yiladi",
      "C": "DEFAULT_PARSER_CLASSES bo‘sh ro‘yxat qilinadi",
      "D": "DEFAULT_RENDERER_CLASSES ga faqat JSONRenderer qoldiriladi"
    },
    "correctOption": "D",
    "explanation": "REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] da faqat 'rest_framework.renderers.JSONRenderer' qoldirilsa, Browsable API o‘chadi va unumdorlik oshadi."
  },
  {
    "id": "t1-q25",
    "topicId": "topic-1",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "Real vaqtda ko‘p filtrlar va dinamik grafiklar ishlaydigan murakkab CRM paneli uchun qaysi arxitektura eng maqbul?",
    "options": {
      "A": "Har bir filtrda butun HTML ni qayta yuklovchi SSR",
      "B": "Faqat statik HTML fayllardan iborat sayt",
      "C": "Ma'lumotlar bazasisiz oddiy CGI skriptlar",
      "D": "DRF REST API backend + React/Vue CSR frontend"
    },
    "correctOption": "D",
    "explanation": "Yuqori interaktivlikka ega ichki boshqaruv panellarida (SEO muhim bo‘lmagan) DRF API + CSR frontend tezkor va silliq foydalanuvchi tajribasini beradi."
  },
  {
    "id": "t1-q26",
    "topicId": "topic-1",
    "type": "open",
    "difficulty": "easy",
    "category": "terms",
    "text": "REST qisqartmasining to‘liq inglizcha yoyilmasini yozing.",
    "acceptedAnswers": [
      "Representational State Transfer"
    ],
    "requiresMentorReview": false,
    "explanation": "REST — Representational State Transfer bo‘lib, tarmoq ilovalarini loyihalash uchun arxitektura uslubidir."
  },
  {
    "id": "t1-q27",
    "topicId": "topic-1",
    "type": "open",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "DRF da funksiya asosidagi view ga JSON va HTTP metodlarni qo‘llab-quvvatlash uchun qo‘yiladigan dekorator nomini yozing (masalan: @...).",
    "code": "# Bu yerga dekorator yoziladi\ndef status_view(request):\n    return Response({'alive': True})",
    "acceptedAnswers": [
      "@api_view",
      "api_view",
      "@api_view(['GET'])",
      "@api_view([\"GET\"])"
    ],
    "requiresMentorReview": false,
    "explanation": "@api_view dekoratori funksiya asosidagi view larni DRF APIView o‘ramiga joylab, Request va Response obyektlari bilan ishlashini ta'minlaydi.",
    "codeExplanation": "@api_view(['GET']) ko‘rinishida ruxsat etilgan HTTP metodlar ro‘yxati beriladi."
  },
  {
    "id": "t1-q28",
    "topicId": "topic-1",
    "type": "open",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi kodda JSON so‘rov tanasini o‘qish uchun request.POST o‘rniga DRF ning qaysi atributi yozilishi kerak?",
    "code": "@api_view(['POST'])\ndef add_tag(request):\n    tag = request.POST.get('tag')\n    return Response({'tag': tag})",
    "acceptedAnswers": [
      "request.data",
      "data"
    ],
    "requiresMentorReview": false,
    "explanation": "DRF ning request.data atributi JSON, form-data va multipart kabi barcha so‘rov tanalarini yagona interfeysda o‘qish imkonini beradi.",
    "codeExplanation": "request.POST.get('tag') o‘rniga request.data.get('tag') ishlatilishi kerak."
  },
  {
    "id": "t1-q29",
    "topicId": "topic-1",
    "type": "open",
    "difficulty": "medium",
    "category": "theory",
    "text": "SSR va CSR o‘rtasidagi asosiy farqni qisqacha tushuntirib yozing (renderlash qayerda bajariladi va server nima qaytaradi).",
    "acceptedAnswers": [
      "ssr serverda html qaytaradi csr brauzerda json",
      "serverda html brauzerda json"
    ],
    "requiresMentorReview": true,
    "explanation": "SSR da HTML sahifa serverda tayyorlanib yuboriladi; CSR da esa server JSON ma'lumot qaytaradi, HTML interfeysni brauzerda JavaScript yaratadi."
  },
  {
    "id": "t1-q30",
    "topicId": "topic-1",
    "type": "open",
    "difficulty": "hard",
    "category": "practical",
    "text": "Resursni qisman yangilash uchun ishlatiladigan HTTP metod nomini va muvaffaqiyatli o‘chirishda tanasiz qaytariladigan status kod raqamini vergul bilan yozing (masalan: GET, 200).",
    "acceptedAnswers": [
      "PATCH, 204",
      "PATCH,204",
      "patch, 204",
      "patch 204"
    ],
    "requiresMentorReview": false,
    "explanation": "PATCH resursning faqat ko‘rsatilgan maydonlarini yangilaydi; DELETE amali tanasiz muvaffaqiyatli tugaganda 204 (No Content) qaytariladi."
  },
  {
    "id": "t2-q1",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "Django REST Framework kutubxonasini pip orqali o‘rnatish uchun qaysi buyruq to‘g‘ri?",
    "options": {
      "A": "pip install django-rest",
      "B": "pip install djangorestframework",
      "C": "pip install drf-framework",
      "D": "pip install rest-django-api"
    },
    "correctOption": "B",
    "explanation": "PyPI katalogida Django REST Framework paketining rasmiy nomi 'djangorestframework' hisoblanadi."
  },
  {
    "id": "t2-q2",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "DRF ni Django loyihasida faollashtirish uchun INSTALLED_APPS ga qaysi nom qo‘shiladi?",
    "options": {
      "A": "'django_rest_api'",
      "B": "'drf_core'",
      "C": "'djangorestframework'",
      "D": "'rest_framework'"
    },
    "correctOption": "D",
    "explanation": "Paket nomi djangorestframework bo‘lsa-da, settings.py dagi INSTALLED_APPS ro‘yxatiga 'rest_framework' deb yoziladi."
  },
  {
    "id": "t2-q3",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "Ma'lumotlar bazasini loyihalashda 'One-to-Many' (birga-ko‘p) bog‘lanish Django da qaysi maydon bilan yaratiladi?",
    "options": {
      "A": "ManyToManyField",
      "B": "ForeignKey",
      "C": "GenericIPAddressField",
      "D": "OneToOneField"
    },
    "correctOption": "B",
    "explanation": "ForeignKey bir jadvaldagi ko‘plab yozuvlarni boshqa jadvaldagi bitta yozuvga (masalan, ko‘p darslarni bitta kursga) bog‘laydi."
  },
  {
    "id": "t2-q4",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "Yangi Django loyihasini joriy papkada yaratish uchun qaysi buyruq ishlatiladi?",
    "options": {
      "A": "python manage.py initdb config",
      "B": "django-admin startproject config .",
      "C": "python manage.py newproject config",
      "D": "django-admin createapp config ."
    },
    "correctOption": "B",
    "explanation": "django-admin startproject config . buyrug‘i joriy katalog ichida qo‘shimcha ortiqcha papka ochmasdan loyiha yaratadi."
  },
  {
    "id": "t2-q5",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "PostgreSQL bilan ishlash uchun Django loyihasida qaysi Python drayveri keng qo‘llaniladi?",
    "options": {
      "A": "psycopg2 yoki psycopg",
      "B": "mysqlclient",
      "C": "pymongo",
      "D": "redis-py"
    },
    "correctOption": "A",
    "explanation": "Django PostgreSQL bazasiga ulanish uchun psycopg2 (yoki zamonaviy psycopg 3) adapteridan foydalanadi."
  },
  {
    "id": "t2-q6",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "Django modellaridagi o‘zgarishlardan migratsiya faylini yaratuvchi buyruq qaysi?",
    "options": {
      "A": "python manage.py migrate",
      "B": "python manage.py sqlflush",
      "C": "python manage.py makemigrations",
      "D": "python manage.py check"
    },
    "correctOption": "C",
    "explanation": "makemigrations modellardagi o‘zgarishlarni aniqlab migrations/ papkasida yangi fayl yaratadi, migrate esa uni bazaga qo‘llaydi."
  },
  {
    "id": "t2-q7",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "Ma'lumotlar bazasini normallashtirish (Normalization) ning asosiy maqsadi nima?",
    "options": {
      "A": "Indekslarni butunlay o‘chirib tezlikni pasaytirish",
      "B": "Ma'lumotlar takrorlanishini kamaytirish va yaxlitlikni oshirish",
      "C": "Faqat JSON ustunlardan foydalanishga o‘tish",
      "D": "Barcha jadvallarni bitta katta jadvalga birlashtirish"
    },
    "correctOption": "B",
    "explanation": "Normallashtirish ortiqcha takrorlanishni (redundancy) bartaraf etib, ma'lumotlar yaxlitligi va saqlash samaradorligini ta'minlaydi."
  },
  {
    "id": "t2-q8",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "easy",
    "category": "practical",
    "text": "PostgreSQL paroli va SECRET_KEY ni kod ichida ochiq qoldirmaslik uchun qanday yondashuv tavsiya etiladi?",
    "options": {
      "A": "Muhit o‘zgaruvchilari (.env) orqali o‘qish",
      "B": "Ularni README.md faylida saqlash",
      "C": "Ularni urls.py fayliga ko‘chirish",
      "D": "Ularni HTML izohlariga yozib qo‘yish"
    },
    "correctOption": "A",
    "explanation": "Maxfiy kalitlarni .env faylida saqlab, .gitignore ga qo‘shish va os.environ yoki django-environ orqali o‘qish xavfsizlik standartidir."
  },
  {
    "id": "t2-q9",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi DATABASES konfiguratsiyasida qaysi ma'lumotlar bazasi dvigateli sozlangan?",
    "code": "DATABASES = {\n    'default': {\n        'ENGINE': 'django.db.backends.postgresql',\n        'NAME': 'drf_academy_db',\n        'USER': 'postgres',\n        'PASSWORD': 'secret',\n        'HOST': 'localhost',\n        'PORT': '5432',\n    }\n}",
    "options": {
      "A": "PostgreSQL 5432-portdagi bazasi",
      "B": "SQLite3 lokal fayl bazasi",
      "C": "MySQL 8 server bazasi",
      "D": "Oracle Enterprise bazasi"
    },
    "correctOption": "A",
    "explanation": "'ENGINE': 'django.db.backends.postgresql' va standart 5432-port PostgreSQL ulanishini ko‘rsatadi.",
    "codeExplanation": "HOST='localhost' va PORT='5432' mahalliy PostgreSQL serveriga ulanish parametrlaridir."
  },
  {
    "id": "t2-q10",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi settings.py sozlamasida DRF ni ulashda qanday xato qilingan?",
    "code": "INSTALLED_APPS = [\n    'django.contrib.admin',\n    'django.contrib.auth',\n    'django.contrib.contenttypes',\n    'djangorestframework',\n    'courses',\n]",
    "options": {
      "A": "'django.contrib.admin' DRF bilan ishlamaydi",
      "B": "'djangorestframework' o‘rniga 'rest_framework' yozilishi kerak",
      "C": "INSTALLED_APPS tuple emas, dict bo‘lishi kerak",
      "D": "'courses' ilovasi birinchi turishi shart"
    },
    "correctOption": "B",
    "explanation": "INSTALLED_APPS ga 'djangorestframework' yozilsa ModuleNotFoundError chiqadi; to‘g‘ri ilova nomi 'rest_framework' dir.",
    "codeExplanation": "Python moduli nomi rest_framework bo‘lgani uchun aynan shu nom ro‘yxatga kiritiladi."
  },
  {
    "id": "t2-q11",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi REST_FRAMEWORK sozlamasi barcha API endpointlarga qanday ta'sir ko‘rsatadi?",
    "code": "REST_FRAMEWORK = {\n    'DEFAULT_RENDERER_CLASSES': [\n        'rest_framework.renderers.JSONRenderer',\n    ]\n}",
    "options": {
      "A": "Barcha endpointlar autentifikatsiyasiz ochiladi",
      "B": "Barcha endpointlarda sahifalash yoqiladi",
      "C": "Barcha endpointlar faqat JSON qaytaradi",
      "D": "Barcha endpointlar faqat XML qaytaradi"
    },
    "correctOption": "C",
    "explanation": "DEFAULT_RENDERER_CLASSES da faqat JSONRenderer qoldirilganda, barcha DRF view lar faqat JSON javob generatsiya qiladi.",
    "codeExplanation": "BrowsableAPIRenderer ro‘yxatda yo‘qligi sababli HTML interfeys ko‘rsatilmaydi."
  },
  {
    "id": "t2-q12",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi DATABASES sozlamasida PostgreSQL ga ulanishda qanday xato bor?",
    "code": "DATABASES = {\n    'default': {\n        'ENGINE': 'django.db.backends.sqlite3',\n        'NAME': 'academy_db',\n        'USER': 'postgres',\n        'HOST': '127.0.0.1',\n        'PORT': '5432',\n    }\n}",
    "options": {
      "A": "PORT qiymati satr emas, float bo‘lishi kerak",
      "B": "HOST 127.0.0.1 bo‘lishi mumkin emas",
      "C": "NAME kaliti PostgreSQL da ishlatilmaydi",
      "D": "ENGINE noto‘g‘ri, postgresql backend ko‘rsatilmagan"
    },
    "correctOption": "D",
    "explanation": "ENGINE qiymati sqlite3 qilib qoldirilgan; PostgreSQL uchun 'django.db.backends.postgresql' ko‘rsatilishi shart.",
    "codeExplanation": "SQLite3 dvigateli USER, HOST va PORT parametrlarini e'tiborsiz qoldiradi va lokal fayl ochishga urinadi."
  },
  {
    "id": "t2-q13",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi model bog‘lanishida kurs o‘chirilsa, unga tegishli darslar bilan nima sodir bo‘ladi?",
    "code": "class Lesson(models.Model):\n    course = models.ForeignKey(Course, on_delete=models.CASCADE)\n    title = models.CharField(max_length=120)",
    "options": {
      "A": "Kurs bilan birga uning barcha darslari o‘chadi",
      "B": "Darslarning course maydoni NULL bo‘lib qoladi",
      "C": "Kursni o‘chirishga baza ruxsat bermaydi",
      "D": "Darslar boshqa birinchi kursga ko‘chiriladi"
    },
    "correctOption": "A",
    "explanation": "on_delete=models.CASCADE ota obyekt (Course) o‘chirilganda unga bog‘langan barcha farzand yozuvlarni (Lesson) ham avtomatik o‘chiradi.",
    "codeExplanation": "CASCADE kaskadli o‘chirish qoidasini amalga oshiradi."
  },
  {
    "id": "t2-q14",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "medium",
    "category": "terms",
    "text": "ForeignKey da 'on_delete=models.PROTECT' parametri qaysi xatti-harakatni beradi?",
    "options": {
      "A": "Bog‘langan yozuvlarni avtomatik o‘chirib yuboradi",
      "B": "Bog‘langan yozuvlar mavjud bo‘lsa o‘chirishni bloklaydi",
      "C": "Bog‘langan maydonni standart qiymatga o‘zgartiradi",
      "D": "Yozuvni arxiv jadvaliga nusxalab qo‘yadi"
    },
    "correctOption": "B",
    "explanation": "models.PROTECT bog‘liq obyektlar mavjud bo‘lganda ProtectedError tashlab, tasodifiy o‘chirishning oldini oladi."
  },
  {
    "id": "t2-q15",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "Loyihada har bir talaba bir nechta kursga yozila oladi va har bir kursda ko‘p talaba bo‘ladi. Bu qaysi bog‘lanish turi?",
    "options": {
      "A": "Many-to-Many (ko‘pga-ko‘p)",
      "B": "One-to-Many (birga-ko‘p)",
      "C": "Self-referencing (o‘z-o‘ziga)",
      "D": "One-to-One (birga-bir)"
    },
    "correctOption": "A",
    "explanation": "Talabalar va kurslar o‘rtasidagi ikki tomonlama ko‘plik bog‘lanishi Many-to-Many (ManyToManyField yoki oraliq Enrollment jadvali) orqali quriladi."
  },
  {
    "id": "t2-q16",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi settings.py konfiguratsiyasida DEBUG=False qilinganda nima majburiy bo‘ladi?",
    "code": "DEBUG = False\nALLOWED_HOSTS = []",
    "options": {
      "A": "DATABASES bo‘limi SQLite ga qaytarilishi shart",
      "B": "LANGUAGE_CODE ingliz tiliga o‘zgartirilishi shart",
      "C": "ALLOWED_HOSTS ga ruxsat etilgan domenlar kiritilishi shart",
      "D": "INSTALLED_APPS dan admin ilovasi o‘chirilishi shart"
    },
    "correctOption": "C",
    "explanation": "DEBUG = False holatida ALLOWED_HOSTS bo‘sh bo‘lsa, Django CommandError berib serverni ishga tushirmaydi.",
    "codeExplanation": "Xavfsizlik sababli production rejimida qaysi hostlardan so‘rov qabul qilinishi aniq ko‘rsatilishi lozim."
  },
  {
    "id": "t2-q17",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi kodda 'through' parametri nima maqsadda qo‘llanilgan?",
    "code": "class Course(models.Model):\n    title = models.CharField(max_length=100)\n    students = models.ManyToManyField(Student, through='Enrollment')",
    "options": {
      "A": "Boshqa bazadan jadval ko‘chirish uchun",
      "B": "ForeignKey cheklovini o‘chirish uchun",
      "C": "Migratsiyalarni o‘tkazib yuborish uchun",
      "D": "Oraliq jadvalda qo‘shimcha ustunlar saqlash uchun"
    },
    "correctOption": "D",
    "explanation": "through='Enrollment' Many-to-Many bog‘lanishda qo‘shimcha atributlarni (masalan, yozilgan sana, baho) saqlovchi maxsus oraliq model belgilaydi.",
    "codeExplanation": "Django standart oraliq jadval o‘rniga dasturchi yaratgan Enrollment modelidan foydalanadi."
  },
  {
    "id": "t2-q18",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi model maydonida migratsiya vaqtida qanday muammo kelib chiqadi?",
    "code": "class Product(models.Model):\n    category = models.ForeignKey(Category, on_delete=models.SET_NULL)",
    "options": {
      "A": "max_length parametri berilmagan",
      "B": "ForeignKey da SET_NULL mavjud emas",
      "C": "null=True ko‘rsatilmagani uchun xato beradi",
      "D": "Category nomi qo‘shtirnoqsiz yozib bo‘lmaydi"
    },
    "correctOption": "C",
    "explanation": "on_delete=models.SET_NULL ishlatilganda maydon NULL qiymat qabul qila olishi uchun albatta null=True ko‘rsatilishi shart.",
    "codeExplanation": "null=True bo‘lmasa Django tizim tekshiruvi (fields.E320) xatosini chiqaradi."
  },
  {
    "id": "t2-q19",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "Yirik loyihada settings.py ni development va production muhitlari uchun qanday tashkil qilish eng yaxshi amaliyot?",
    "options": {
      "A": "Har safar serverga yuklashdan oldin qo‘lda o‘zgartirish",
      "B": "Barcha sozlamalarni views.py ichiga yozish",
      "C": "Ikkita alohida Django loyihasi yaratish",
      "D": "base.py, dev.py va prod.py modullariga ajratish"
    },
    "correctOption": "D",
    "explanation": "settings/ papkasida umumiy base.py hamda muhitga xos dev.py va prod.py fayllarini ajratish xavfsiz va boshqarishga qulay."
  },
  {
    "id": "t2-q20",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "medium",
    "category": "theory",
    "text": "Ma'lumotlar bazasida tez-tez qidiriladigan ustunga 'db_index=True' qo‘yish qanday ta'sir ko‘rsatadi?",
    "options": {
      "A": "Jadval hajmi ikki barobar kamayadi",
      "B": "INSERT va UPDATE amallari keskin tezlashadi",
      "C": "SELECT so‘rovlari tezlashadi, yozish biroz sekinlashadi",
      "D": "Ustunda takroriy qiymatlar taqiqlanadi"
    },
    "correctOption": "C",
    "explanation": "Indeks qidiruvni (SELECT/WHERE) sezilarli tezlashtiradi, lekin har bir INSERT/UPDATE da indeksni ham yangilash talab etiladi."
  },
  {
    "id": "t2-q21",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Quyidagi DATABASES sozlamasida 'CONN_MAX_AGE': 600 nimani anglatadi?",
    "code": "DATABASES = {\n    'default': {\n        'ENGINE': 'django.db.backends.postgresql',\n        'NAME': 'prod_db',\n        'CONN_MAX_AGE': 600,\n    }\n}",
    "options": {
      "A": "Baza har 600 soniyada zaxira nusxa oladi",
      "B": "Maksimal 600 ta foydalanuvchi ulanishi mumkin",
      "C": "So‘rov 600 soniyadan oshsa bekor qilinadi",
      "D": "Baza ulanishi 600 soniya davomida qayta ishlatiladi"
    },
    "correctOption": "D",
    "explanation": "CONN_MAX_AGE persistent database connection muddatini (soniyada) belgilaydi, bu har bir HTTP so‘rovda yangi TCP ulanish ochish yukini kamaytiradi.",
    "codeExplanation": "Standart qiymat 0 bo‘lib, har so‘rov oxirida ulanish yopiladi; 600 da ulanish 10 daqiqa saqlanadi."
  },
  {
    "id": "t2-q22",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Quyidagi Meta sinfidagi constraints nimani kafolatlaydi?",
    "code": "class Enrollment(models.Model):\n    student = models.ForeignKey(Student, on_delete=models.CASCADE)\n    course = models.ForeignKey(Course, on_delete=models.CASCADE)\n\n    class Meta:\n        constraints = [\n            models.UniqueConstraint(\n                fields=['student', 'course'], name='uniq_student_course'\n            )\n        ]",
    "options": {
      "A": "Bir talaba faqat bitta kursga yozila oladi",
      "B": "Bir kursga faqat bitta talaba yozila oladi",
      "C": "Talaba o‘chirilganda kurs ham o‘chiriladi",
      "D": "Bir talaba ayni bir kursga ikki marta yozila olmaydi"
    },
    "correctOption": "D",
    "explanation": "UniqueConstraint(fields=['student', 'course']) juftlikning takrorlanmasligini baza darajasida kafolatlaydi.",
    "codeExplanation": "Talaba boshqa kurslarga yozilishi mumkin, lekin ayni bir kursga takror yozilsa IntegrityError chiqadi."
  },
  {
    "id": "t2-q23",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "hard",
    "category": "bug_finding",
    "text": "Quyidagi Django konfiguratsiyasida production muhiti uchun jiddiy xavfsizlik xatosi qaysi?",
    "code": "DEBUG = True\nALLOWED_HOSTS = ['*']\nSECRET_KEY = 'dev-key-123'",
    "options": {
      "A": "Uchala sozlama ham production uchun xavfli qoldirilgan",
      "B": "ALLOWED_HOSTS ro‘yxat emas, satr bo‘lishi kerak",
      "C": "SECRET_KEY faqat raqamlardan iborat bo‘lishi kerak",
      "D": "DEBUG qiymati satr ko‘rinishida yozilishi kerak"
    },
    "correctOption": "A",
    "explanation": "Production da DEBUG=True ichki xato izlarini (traceback) oshkor qiladi, ALLOWED_HOSTS=['*'] Host Header hujumiga ochiq, zaif SECRET_KEY esa imzolarni xavf ostiga qo‘yadi.",
    "codeExplanation": "Production da DEBUG=False, aniq domenlar va muhitdan olinadigan kuchli SECRET_KEY shart."
  },
  {
    "id": "t2-q24",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "Moliyaviy tranzaksiyalar narxini PostgreSQL da saqlash uchun qaysi Django maydon turi eng to‘g‘ri?",
    "options": {
      "A": "BigIntegerField",
      "B": "FloatField",
      "C": "CharField",
      "D": "DecimalField"
    },
    "correctOption": "D",
    "explanation": "FloatField da ikkilik yaxlitlash xatolari (masalan, 0.1 + 0.2 = 0.30000000000000004) yuzaga keladi; pul qiymatlari uchun aniq DecimalField ishlatiladi."
  },
  {
    "id": "t2-q25",
    "topicId": "topic-2",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "PostgreSQL bazasida Django ilovasining vaqt zonalari bilan to‘g‘ri ishlashi uchun settings.py da qaysi sozlama True bo‘lishi kerak?",
    "options": {
      "A": "APPEND_SLASH",
      "B": "USE_I18N",
      "C": "USE_TZ",
      "D": "USE_L10N"
    },
    "correctOption": "C",
    "explanation": "USE_TZ = True bo‘lganda Django barcha sana-vaqtlarni bazada UTC formatida timezone-aware ko‘rinishda saqlaydi."
  },
  {
    "id": "t2-q26",
    "topicId": "topic-2",
    "type": "open",
    "difficulty": "easy",
    "category": "terms",
    "text": "PostgreSQL ma'lumotlar bazasining standart tarmoq port raqamini yozing.",
    "acceptedAnswers": [
      "5432"
    ],
    "requiresMentorReview": false,
    "explanation": "PostgreSQL sukut bo‘yicha 5432-portda tinglaydi."
  },
  {
    "id": "t2-q27",
    "topicId": "topic-2",
    "type": "open",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "settings.py da barcha DRF global sozlamalari yoziladigan lug‘at (dict) o‘zgaruvchisining aniq nomini yozing.",
    "code": "________ = {\n    'DEFAULT_PERMISSION_CLASSES': [\n        'rest_framework.permissions.IsAuthenticated',\n    ]\n}",
    "acceptedAnswers": [
      "REST_FRAMEWORK"
    ],
    "requiresMentorReview": false,
    "explanation": "Django REST Framework ning barcha global sozlamalari settings.py dagi REST_FRAMEWORK lug‘atida jamlanadi.",
    "codeExplanation": "DRF avtomatik ravishda settings.REST_FRAMEWORK kalitini o‘qiydi."
  },
  {
    "id": "t2-q28",
    "topicId": "topic-2",
    "type": "open",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi DATABASES lug‘atida PostgreSQL uchun 'ENGINE' qiymatini to‘liq va to‘g‘ri yozing.",
    "code": "DATABASES = {\n    'default': {\n        'ENGINE': '???',\n        'NAME': 'drf_db',\n    }\n}",
    "acceptedAnswers": [
      "django.db.backends.postgresql",
      "'django.db.backends.postgresql'",
      "\"django.db.backends.postgresql\""
    ],
    "requiresMentorReview": false,
    "explanation": "Django da PostgreSQL bazasi uchun standart backend yo‘li 'django.db.backends.postgresql' hisoblanadi.",
    "codeExplanation": "Bu qiymat Django ga psycopg drayveri orqali PostgreSQL ga ulanishni ko‘rsatadi."
  },
  {
    "id": "t2-q29",
    "topicId": "topic-2",
    "type": "open",
    "difficulty": "medium",
    "category": "theory",
    "text": "makemigrations va migrate buyruqlari o‘rtasidagi farqni qisqacha tushuntiring.",
    "acceptedAnswers": [
      "makemigrations fayl yaratadi migrate bazaga qollaydi",
      "makemigrations migratsiya yaratadi migrate bazaga otkazadi"
    ],
    "requiresMentorReview": true,
    "explanation": "makemigrations modellardagi o‘zgarishlar asosida migratsiya fayllarini yaratadi, migrate esa shu fayllardagi SQL amallarni bazaga tatbiq etadi."
  },
  {
    "id": "t2-q30",
    "topicId": "topic-2",
    "type": "open",
    "difficulty": "hard",
    "category": "practical",
    "text": "Django da yaratilgan migratsiyalarni bazaga qo‘llamasdan ularning SQL kodini ko‘rish buyrug‘i nomini yozing (manage.py dan keyingi buyruq).",
    "acceptedAnswers": [
      "sqlmigrate"
    ],
    "requiresMentorReview": false,
    "explanation": "python manage.py sqlmigrate <app_name> <migration_number> buyrug‘i migratsiya bajaradigan aniq SQL buyruqlarni chop etadi."
  },
  {
    "id": "t3-q1",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "Django REST Framework da Serializer qaysi asosiy vazifani bajaradi?",
    "options": {
      "A": "URL manzillarni routerlarga ulaydi",
      "B": "HTML shablonlarni brauzerga uzatadi",
      "C": "PostgreSQL serverini qayta yuklaydi",
      "D": "Murakkab obyektlarni JSON ga va aksincha o‘giradi"
    },
    "correctOption": "D",
    "explanation": "Serializer QuerySet va model obyektlarini JSON kabi formatlarga o‘giradi (serializatsiya) hamda kiruvchi ma'lumotni tekshirib obyektga aylantiradi (deserializatsiya)."
  },
  {
    "id": "t3-q2",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "ModelSerializer oddiy Serializer dan nimasi bilan farq qiladi?",
    "options": {
      "A": "Ma'lumotlar bazasiga ulanmasdan ishlaydi",
      "B": "Faqat GET so‘rovlarini qo‘llab-quvvatlaydi",
      "C": "Validatsiya mexanizmini butunlay o‘chiradi",
      "D": "Model maydonlarini avtomatik generatsiya qiladi"
    },
    "correctOption": "D",
    "explanation": "ModelSerializer ko‘rsatilgan Django modeli asosida maydonlarni hamda standart create() va update() metodlarini avtomatik yaratib beradi."
  },
  {
    "id": "t3-q3",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "DRF da barcha CRUD amallarini (list, retrieve, create, update, destroy) bitta klassda birlashtiruvchi ViewSet qaysi?",
    "options": {
      "A": "ReadOnlyModelViewSet",
      "B": "ModelViewSet",
      "C": "APIView",
      "D": "GenericAPIView"
    },
    "correctOption": "B",
    "explanation": "ModelViewSet barcha 5 ta mixin va GenericViewSet ni birlashtirib, to‘liq CRUD operatsiyalarini tayyor holda taqdim etadi."
  },
  {
    "id": "t3-q4",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "ViewSet lar uchun URL marshrutlarini avtomatik generatsiya qiluvchi DRF komponenti qaysi?",
    "options": {
      "A": "FilterBackend",
      "B": "Serializer",
      "C": "Router",
      "D": "Middleware"
    },
    "correctOption": "C",
    "explanation": "SimpleRouter va DefaultRouter kabi routerlar ViewSet metodlari asosida URL yo‘llarini avtomatik yaratadi."
  },
  {
    "id": "t3-q5",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "Serializer orqali bir nechta model obyektini (QuerySet) serializatsiya qilishda qaysi parametr beriladi?",
    "options": {
      "A": "many=True",
      "B": "all=True",
      "C": "bulk=True",
      "D": "list=True"
    },
    "correctOption": "A",
    "explanation": "QuerySet yoki obyektlar ro‘yxatini serializatsiya qilishda Serializer(queryset, many=True) ko‘rinishida many=True uzatiladi."
  },
  {
    "id": "t3-q6",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "DRF da APIView klassida GET, POST, PUT kabi HTTP so‘rovlar qanday usulda qayta ishlanadi?",
    "options": {
      "A": "list(), create(), destroy() metodlari orqali",
      "B": "get(), post(), put() nomli metodlar orqali",
      "C": "render(), parse(), save() metodlari orqali",
      "D": "connect(), send(), close() metodlari orqali"
    },
    "correctOption": "B",
    "explanation": "APIView da har bir HTTP metod o‘z nomidagi kichik harfli metodga (get, post, put, patch, delete) yo‘naltiriladi."
  },
  {
    "id": "t3-q7",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "ReadOnlyModelViewSet foydalanuvchiga qaysi amallarga ruxsat beradi?",
    "options": {
      "A": "Faqat yaratish va o‘chirish (create, destroy)",
      "B": "Faqat o‘qish (list va retrieve)",
      "C": "Faqat yangilash (update, partial_update)",
      "D": "Barcha CRUD amallariga"
    },
    "correctOption": "B",
    "explanation": "ReadOnlyModelViewSet faqat RetrieveModelMixin va ListModelMixin ni o‘z ichiga oladi, ya'ni faqat o‘qish amallarini bajaradi."
  },
  {
    "id": "t3-q8",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "easy",
    "category": "practical",
    "text": "Serializer da kiruvchi ma'lumot noto‘g‘ri bo‘lsa avtomatik 400 Bad Request qaytarish uchun qaysi chaqiruv ishlatiladi?",
    "options": {
      "A": "serializer.validate(strict=True)",
      "B": "serializer.save(force=True)",
      "C": "serializer.is_valid(raise_exception=True)",
      "D": "serializer.check(error=400)"
    },
    "correctOption": "C",
    "explanation": "is_valid(raise_exception=True) validatsiya xatosi topilganda ValidationError tashlaydi va DRF uni 400 Bad Request JSON javobiga aylantiradi."
  },
  {
    "id": "t3-q9",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi ModelSerializer da 'id' va 'created_at' maydonlari qanday xususiyatga ega?",
    "code": "class CourseSerializer(serializers.ModelSerializer):\n    class Meta:\n        model = Course\n        fields = ['id', 'title', 'price', 'created_at']\n        read_only_fields = ['id', 'created_at']",
    "options": {
      "A": "Maydonlar majburiy kiritiladigan bo‘ladi",
      "B": "Javobda chiqmaydi, faqat POST da yuboriladi",
      "C": "Ikkala maydon ham bazadan o‘chiriladi",
      "D": "Javobda chiqadi, lekin POST/PUT da o‘zgartirilmaydi"
    },
    "correctOption": "D",
    "explanation": "read_only_fields da ko‘rsatilgan maydonlar serializatsiyada (GET) qaytadi, ammo deserializatsiyada (POST/PUT) e'tiborga olinmaydi.",
    "codeExplanation": "read_only_fields mijoz tomonidan tizim maydonlari o‘zgartirilishining oldini oladi."
  },
  {
    "id": "t3-q10",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi DefaultRouter kodi qaysi URL manzillarini avtomatik yaratadi?",
    "code": "from rest_framework.routers import DefaultRouter\nfrom .views import BookViewSet\n\nrouter = DefaultRouter()\nrouter.register('books', BookViewSet, basename='book')\nurlpatterns = router.urls",
    "options": {
      "A": "Faqat /books/<pk>/ detal manzilini",
      "B": "/books/, /books/<pk>/ va API root manzilini",
      "C": "Faqat /admin/books/ boshqaruv manzilini",
      "D": "Faqat /books/ ro‘yxat manzilini"
    },
    "correctOption": "B",
    "explanation": "DefaultRouter SimpleRouter dan farqli ravishda list (/books/), detail (/books/<pk>/) hamda asosiy API Root (/) sahifasini yaratadi.",
    "codeExplanation": "DefaultRouter qo‘shimcha ravishda format suffix (.json) va API root endpointini ham qo‘shadi."
  },
  {
    "id": "t3-q11",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi APIView kodida qanday xato mavjud?",
    "code": "class CourseListView(APIView):\n    def get(self, request):\n        courses = Course.objects.all()\n        serializer = CourseSerializer(courses)\n        return Response(serializer.data)",
    "options": {
      "A": "serializer.data o‘rniga serializer.json kerak",
      "B": "CourseSerializer ga many=True berilmagan",
      "C": "Course.objects.all() list ga o‘girilishi shart",
      "D": "APIView ichida get() metodi ishlamaydi"
    },
    "correctOption": "B",
    "explanation": "QuerySet (bir nechta obyekt) uzatilganda many=True berilmasa, AttributeError ('QuerySet' object has no attribute 'title') yuzaga keladi.",
    "codeExplanation": "CourseSerializer(courses, many=True) deb yozilishi lozim."
  },
  {
    "id": "t3-q12",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi SerializerMethodField qaysi metodni avtomatik chaqiradi?",
    "code": "class StudentSerializer(serializers.ModelSerializer):\n    full_name = serializers.SerializerMethodField()\n\n    class Meta:\n        model = Student\n        fields = ['id', 'first_name', 'last_name', 'full_name']",
    "options": {
      "A": "get_full_name(self, obj)",
      "B": "create_full_name(self, obj)",
      "C": "render_full_name(self, obj)",
      "D": "validate_full_name(self, obj)"
    },
    "correctOption": "A",
    "explanation": "SerializerMethodField standart holda get_<field_name>(self, obj) nomli metodni chaqiradi; bu yerda get_full_name.",
    "codeExplanation": "method_name parametri berilmasa, DRF avtomatik 'get_' prefiksini maydon nomiga qo‘shadi."
  },
  {
    "id": "t3-q13",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi ModelSerializer da qanday konfiguratsiya xatosi bor?",
    "code": "class LessonSerializer(serializers.ModelSerializer):\n    class Meta:\n        model = Lesson\n        fields = ['id', 'title']\n        exclude = ['created_at']",
    "options": {
      "A": "Meta klassi Serializer tashqarisida bo‘lishi kerak",
      "B": "fields ro‘yxatida kamida 3 ta maydon shart",
      "C": "fields va exclude bir vaqtda ishlatilmaydi",
      "D": "exclude faqat oddiy Serializer da ishlaydi"
    },
    "correctOption": "C",
    "explanation": "ModelSerializer ning Meta sinfida fields va exclude atributlarini birgalikda berish AssertionError xatosiga olib keladi.",
    "codeExplanation": "Yoki faqat fields, yoki faqat exclude ko‘rsatilishi kerak."
  },
  {
    "id": "t3-q14",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "medium",
    "category": "terms",
    "text": "GenericAPIView oddiy APIView ga qaysi ikki muhim atributni qo‘shib beradi?",
    "options": {
      "A": "template_name va context_object_name",
      "B": "app_name va url_prefix",
      "C": "database_engine va cache_timeout",
      "D": "queryset va serializer_class"
    },
    "correctOption": "D",
    "explanation": "GenericAPIView queryset va serializer_class (shuningdek get_queryset, get_object, get_serializer) asosiy mexanizmlarini qo‘shadi."
  },
  {
    "id": "t3-q15",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi Generic view qaysi HTTP metodlarni qo‘llab-quvvatlaydi?",
    "code": "from rest_framework.generics import ListCreateAPIView\n\nclass ArticleListCreateView(ListCreateAPIView):\n    queryset = Article.objects.all()\n    serializer_class = ArticleSerializer",
    "options": {
      "A": "Faqat PUT va PATCH",
      "B": "GET, PUT, PATCH va DELETE",
      "C": "GET (ro‘yxat) va POST (yaratish)",
      "D": "Faqat GET va DELETE"
    },
    "correctOption": "C",
    "explanation": "ListCreateAPIView ro‘yxatni olish (GET) va yangi obyekt yaratish (POST) amallarini bajaradi.",
    "codeExplanation": "ListModelMixin + CreateModelMixin + GenericAPIView kombinatsiyasi."
  },
  {
    "id": "t3-q16",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi custom validatsiya metodi qachon ishga tushadi?",
    "code": "class CourseSerializer(serializers.ModelSerializer):\n    def validate_price(self, value):\n        if value < 0:\n            raise serializers.ValidationError('Narx manfiy bo‘lmasin')\n        return value",
    "options": {
      "A": "Model migratsiyasi bajarilayotganda",
      "B": "Router URL larni ro‘yxatdan o‘tkazganda",
      "C": "GET so‘rovida obyektlarni o‘qishda",
      "D": "serializer.is_valid() chaqirilganda"
    },
    "correctOption": "D",
    "explanation": "validate_<field_name> metodi maydon darajasidagi validatsiya bo‘lib, serializer.is_valid() jarayonida avtomatik chaqiriladi.",
    "codeExplanation": "Agar price < 0 bo‘lsa, ValidationError qaytadi; aks holda qiymat return qilinadi."
  },
  {
    "id": "t3-q17",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi validate_title metodida qanday mantiqiy xato mavjud?",
    "code": "def validate_title(self, value):\n    if len(value) < 3:\n        raise serializers.ValidationError('Juda qisqa')",
    "options": {
      "A": "ValidationError DRF da mavjud emas",
      "B": "Metod oxirida 'return value' yozilmagan",
      "C": "len() funksiyasi satrda ishlamaydi",
      "D": "Metod nomi check_title bo‘lishi kerak"
    },
    "correctOption": "B",
    "explanation": "Field-level validatsiya metodi tekshiruvdan o‘tgan qiymatni albatta return qilishi shart, aks holda validated_data['title'] None bo‘lib qoladi.",
    "codeExplanation": "Python da return yozilmagan funksiya None qaytaradi."
  },
  {
    "id": "t3-q18",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "Bitta obyektning faqat bitta maydonini (masalan, status) yangilashda serializer qanday chaqiriladi?",
    "options": {
      "A": "CourseSerializer(instance, data=request.data, partial=True)",
      "B": "CourseSerializer(instance, data=request.data, many=True)",
      "C": "CourseSerializer(data=request.data, update=True)",
      "D": "CourseSerializer(instance, patch=True)"
    },
    "correctOption": "A",
    "explanation": "partial=True parametri PATCH so‘rovlarida majburiy maydonlarning barchasini yubormasdan qisman yangilash imkonini beradi."
  },
  {
    "id": "t3-q19",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "Oddiy CRUD dan tashqari, ViewSet da /api/courses/5/publish/ kabi qo‘shimcha endpoint ochish uchun qaysi dekorator ishlatiladi?",
    "options": {
      "A": "@action(detail=True, methods=['post'])",
      "B": "@api_view(detail=True)",
      "C": "@router_path(detail=True)",
      "D": "@endpoint(pk=True, method='post')"
    },
    "correctOption": "A",
    "explanation": "rest_framework.decorators.action dekoratori ViewSet ga maxsus list (detail=False) yoki obyekt (detail=True) endpointlari qo‘shadi."
  },
  {
    "id": "t3-q20",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "medium",
    "category": "theory",
    "text": "Serializer da 'write_only=True' parametri ko‘pincha qaysi maydon uchun qo‘llaniladi?",
    "options": {
      "A": "created_at va updated_at sanalari uchun",
      "B": "Obyektning id raqami uchun",
      "C": "Hisoblanadigan statistika uchun",
      "D": "Parol (password) maydoni uchun"
    },
    "correctOption": "D",
    "explanation": "write_only=True maydonni kiruvchi so‘rovda qabul qiladi, lekin API javobida hech qachon qaytarmaydi — bu parollar uchun ideal."
  },
  {
    "id": "t3-q21",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Quyidagi ViewSet da 'get_queryset()' ishlatilganda router.register() da nima ko‘rsatilishi shart?",
    "code": "class MyCourseViewSet(viewsets.ModelViewSet):\n    serializer_class = CourseSerializer\n\n    def get_queryset(self):\n        return Course.objects.filter(author=self.request.user)",
    "options": {
      "A": "basename='my-course' parametri",
      "B": "lookup_field='author' parametri",
      "C": "prefix='v1' parametri",
      "D": "strict=True parametri"
    },
    "correctOption": "A",
    "explanation": "ViewSet da klass atributi sifatida queryset aniqlanmagan bo‘lsa, router model nomini aniqlay olmaydi va basename ko‘rsatilishi talab etiladi.",
    "codeExplanation": "basename berilmasa AssertionError: `basename` argument not specified chiqadi."
  },
  {
    "id": "t3-q22",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Quyidagi perform_create() metodi qanday vazifani bajaradi?",
    "code": "class PostViewSet(viewsets.ModelViewSet):\n    queryset = Post.objects.all()\n    serializer_class = PostSerializer\n\n    def perform_create(self, serializer):\n        serializer.save(author=self.request.user)",
    "options": {
      "A": "Post yaratilganda author ni joriy user ga bog‘laydi",
      "B": "Foydalanuvchining barcha eski postlarini o‘chiradi",
      "C": "Postni bazaga saqlamasdan faqat validatsiya qiladi",
      "D": "author maydonini JSON javobidan yashirib qo‘yadi"
    },
    "correctOption": "A",
    "explanation": "perform_create() yangi obyekt saqlanishidan oldin qo‘shimcha maydonlarni (masalan, author=request.user) xavfsiz biriktirish uchun override qilinadi.",
    "codeExplanation": "Mijozdan author ID sini so‘ramasdan, serverda autentifikatsiyadan o‘tgan foydalanuvchi o‘rnatiladi."
  },
  {
    "id": "t3-q23",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "hard",
    "category": "bug_finding",
    "text": "Quyidagi kodda serializer.data ga murojaat qilishda qanday xato yuz beradi?",
    "code": "serializer = CourseSerializer(data=request.data)\nreturn Response(serializer.data)",
    "options": {
      "A": "Response ichida status=200 yozilmagan",
      "B": "request.data lug‘at emas, ro‘yxat bo‘lishi kerak",
      "C": "CourseSerializer da instance majburiy berilishi shart",
      "D": "is_valid() chaqirilmasdan .data ga murojaat qilingan"
    },
    "correctOption": "D",
    "explanation": "Serializer data= bilan ishga tushirilganda is_valid() chaqirilmasdan .data o‘qilsa, AssertionError chiqadi.",
    "codeExplanation": "Avval serializer.is_valid(raise_exception=True), keyin serializer.save() va serializer.data ishlatiladi."
  },
  {
    "id": "t3-q24",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "Bitta ViewSet da list (GET) uchun qisqa serializer, retrieve (GET /id/) uchun batafsil serializer ishlatish qaysi metod orqali amalga oshiriladi?",
    "options": {
      "A": "get_queryset()",
      "B": "get_permissions()",
      "C": "get_serializer_class()",
      "D": "get_object()"
    },
    "correctOption": "C",
    "explanation": "get_serializer_class(self) metodini override qilib, self.action == 'list' holatida boshqa, aks holda boshqa serializer qaytarish mumkin."
  },
  {
    "id": "t3-q25",
    "topicId": "topic-3",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "Course ro‘yxatini olishda har bir kursning category (ForeignKey) ma'lumoti ham serializatsiya qilinsa, N+1 muammosini oldini olish uchun queryset qanday yoziladi?",
    "options": {
      "A": "Course.objects.all().distinct()",
      "B": "Course.objects.only('id')",
      "C": "Course.objects.select_related('category')",
      "D": "Course.objects.values_list('category')"
    },
    "correctOption": "C",
    "explanation": "select_related('category') SQL JOIN orqali bog‘langan ForeignKey obyektini bitta so‘rovda yuklab, N+1 muammosini bartaraf etadi."
  },
  {
    "id": "t3-q26",
    "topicId": "topic-3",
    "type": "open",
    "difficulty": "easy",
    "category": "terms",
    "text": "ModelSerializer da modelning barcha maydonlarini avtomatik kiritish uchun fields atributiga qaysi maxsus satr qiymati beriladi?",
    "acceptedAnswers": [
      "__all__",
      "'__all__'",
      "\"__all__\""
    ],
    "requiresMentorReview": false,
    "explanation": "fields = '__all__' modeldagi barcha maydonlarni serializerga kiritadi."
  },
  {
    "id": "t3-q27",
    "topicId": "topic-3",
    "type": "open",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi Serializer da bir nechta maydonni o‘zaro taqqoslab tekshirish (object-level validation) uchun qaysi metod nomi override qilinadi?",
    "code": "class DateRangeSerializer(serializers.Serializer):\n    start = serializers.DateField()\n    end = serializers.DateField()\n\n    def ________(self, attrs):\n        if attrs['start'] > attrs['end']:\n            raise serializers.ValidationError('Sana noto‘g‘ri')\n        return attrs",
    "acceptedAnswers": [
      "validate"
    ],
    "requiresMentorReview": false,
    "explanation": "Bir nechta maydonga bog‘liq tekshiruvlar uchun validate(self, attrs) metodi override qilinadi.",
    "codeExplanation": "validate() barcha maydonlar alohida tekshirilgach chaqiriladi."
  },
  {
    "id": "t3-q28",
    "topicId": "topic-3",
    "type": "open",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi ViewSet da 'id' o‘rniga 'slug' maydoni bo‘yicha /api/courses/drf-asoslari/ manzilini ochish uchun qaysi atribut o‘rnatilishi kerak?",
    "code": "class CourseViewSet(viewsets.ModelViewSet):\n    queryset = Course.objects.all()\n    serializer_class = CourseSerializer\n    ________ = 'slug'",
    "acceptedAnswers": [
      "lookup_field"
    ],
    "requiresMentorReview": false,
    "explanation": "lookup_field atributi standart 'pk' o‘rniga obyekt qidiriladigan model maydonini (masalan, 'slug') belgilaydi.",
    "codeExplanation": "lookup_field = 'slug' bilan router avtomatik slug bo‘yicha qidiradi."
  },
  {
    "id": "t3-q29",
    "topicId": "topic-3",
    "type": "open",
    "difficulty": "medium",
    "category": "theory",
    "text": "APIView, GenericAPIView va ModelViewSet o‘rtasidagi asosiy abstraksiya farqini qisqacha izohlang.",
    "acceptedAnswers": [
      "apiview eng quyi daraja genericapiview queryset va serializer qoshadi modelviewset toliq crud beradi"
    ],
    "requiresMentorReview": true,
    "explanation": "APIView eng past darajadagi moslashuvchan klass; GenericAPIView queryset/serializer mexanizmini qo‘shadi; ModelViewSet esa barcha CRUD amallarini tayyor holda beradi."
  },
  {
    "id": "t3-q30",
    "topicId": "topic-3",
    "type": "open",
    "difficulty": "hard",
    "category": "practical",
    "text": "ViewSet ga /api/courses/stats/ (obyekt ID sisiz) qo‘shimcha GET endpointini qo‘shuvchi @action dekoratorining to‘liq ko‘rinishini yozing.",
    "acceptedAnswers": [
      "@action(detail=False, methods=['get'])",
      "@action(detail=False, methods=[\"get\"])",
      "@action(detail=False, methods=['GET'])",
      "@action(methods=['get'], detail=False)"
    ],
    "requiresMentorReview": false,
    "explanation": "detail=False ro‘yxat darajasidagi (/api/courses/stats/) endpoint yaratadi, methods=['get'] esa GET so‘rovini belgilaydi."
  },
  {
    "id": "t4-q1",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "Autentifikatsiya (Authentication) jarayoni tizimda nimani aniqlaydi?",
    "options": {
      "A": "Foydalanuvchining qaysi amallarga haqqi borligini",
      "B": "Ma'lumotlar bazasidagi jadvallar sonini hisoblaydi",
      "C": "Foydalanuvchi haqiqatan kim ekanligini tasdiqlaydi",
      "D": "API javobini JSON formatiga o‘giradi"
    },
    "correctOption": "C",
    "explanation": "Autentifikatsiya foydalanuvchining shaxsini (parol, token, JWT orqali) tasdiqlash jarayonidir; ruxsatlar esa avtorizatsiyaga kiradi."
  },
  {
    "id": "t4-q2",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "Identifikatsiya, autentifikatsiya va avtorizatsiya jarayonlarining to‘g‘ri ketma-ketligi qaysi?",
    "options": {
      "A": "Autentifikatsiya -> Avtorizatsiya -> Identifikatsiya",
      "B": "Identifikatsiya -> Autentifikatsiya -> Avtorizatsiya",
      "C": "Avtorizatsiya -> Autentifikatsiya -> Identifikatsiya",
      "D": "Avtorizatsiya -> Identifikatsiya -> Autentifikatsiya"
    },
    "correctOption": "B",
    "explanation": "Avval foydalanuvchi o‘zini tanishtiradi (identifikatsiya), so‘ng shaxsi tasdiqlanadi (autentifikatsiya), keyin ruxsatlari tekshiriladi (avtorizatsiya)."
  },
  {
    "id": "t4-q3",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "JSON Web Token (JWT) nechta nuqta bilan ajratilgan qismdan iborat?",
    "options": {
      "A": "5 ta (Algo, User, Role, Exp, Hash)",
      "B": "2 ta (Header va Payload)",
      "C": "3 ta (Header, Payload, Signature)",
      "D": "4 ta (Version, Header, Body, Footer)"
    },
    "correctOption": "C",
    "explanation": "JWT strukturasi nuqta bilan ajratilgan uchta Base64Url qismdan iborat: Header.Payload.Signature."
  },
  {
    "id": "t4-q4",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "Django da Custom User Model yaratilganda settings.py da qaysi sozlama ko‘rsatilishi shart?",
    "options": {
      "A": "AUTH_USER_MODEL = 'users.CustomUser'",
      "B": "DEFAULT_USER_CLASS = 'users.CustomUser'",
      "C": "USER_PROFILE_MODEL = 'users.CustomUser'",
      "D": "CUSTOM_AUTH_TABLE = 'users.CustomUser'"
    },
    "correctOption": "A",
    "explanation": "Django standart auth.User o‘rniga maxsus modeldan foydalanishi uchun AUTH_USER_MODEL = 'app_label.ModelName' ko‘rsatiladi."
  },
  {
    "id": "t4-q5",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "TokenAuthentication ishlatilganda DRF ning qaysi ichki ilovasi INSTALLED_APPS ga qo‘shilishi kerak?",
    "options": {
      "A": "'rest_framework.jwt'",
      "B": "'rest_framework.sessions'",
      "C": "'rest_framework.oauth2'",
      "D": "'rest_framework.authtoken'"
    },
    "correctOption": "D",
    "explanation": "DRF ning o‘rnatilgan TokenAuthentication tizimi uchun 'rest_framework.authtoken' INSTALLED_APPS ga qo‘shiladi va migrate qilinadi."
  },
  {
    "id": "t4-q6",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "SessionAuthentication da foydalanuvchi autentifikatsiya holati qayerda saqlanadi?",
    "options": {
      "A": "Faqat mijozning JWT payload qismida",
      "B": "URL query parametrlarida ochiq holda",
      "C": "Faqat HTML meta teglarida",
      "D": "Server bazasida va brauzer cookie da"
    },
    "correctOption": "D",
    "explanation": "SessionAuthentication Django sessiyalariga tayanadi: sessiya ma'lumoti serverda, sessionid esa brauzer cookie da saqlanadi."
  },
  {
    "id": "t4-q7",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "JWT autentifikatsiyasida 'Refresh Token' ning asosiy vazifasi nima?",
    "options": {
      "A": "Muddati tugagan Access Tokenni yangilab berish",
      "B": "Foydalanuvchi parolini avtomatik o‘zgartirish",
      "C": "Ma'lumotlar bazasi keshini tozalash",
      "D": "HTTPS sertifikatini qayta imzolash"
    },
    "correctOption": "A",
    "explanation": "Qisqa muddatli Access Token eskirganda, foydalanuvchini qayta login qildirmasdan yangi Access Token olish uchun Refresh Token ishlatiladi."
  },
  {
    "id": "t4-q8",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "easy",
    "category": "practical",
    "text": "Mobil ilova (Android/iOS) va alohida React frontend bilan ishlaydigan DRF API uchun qaysi autentifikatsiya eng qulay?",
    "options": {
      "A": "Faqat IP manzil bo‘yicha tekshiruv",
      "B": "Faqat BasicAuthentication",
      "C": "JWT (SimpleJWT) autentifikatsiyasi",
      "D": "Faqat SessionAuthentication"
    },
    "correctOption": "C",
    "explanation": "JWT stateless bo‘lgani va cookie ga bog‘lanmagani sababli mobil ilovalar hamda SPA frontendlar uchun eng qulay yechimdir."
  },
  {
    "id": "t4-q9",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi HTTP sarlavha qaysi DRF autentifikatsiya klassi uchun mo‘ljallangan?",
    "code": "GET /api/profile/ HTTP/1.1\nHost: api.drfacademy.uz\nAuthorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
    "options": {
      "A": "SessionAuthentication",
      "B": "JWTAuthentication",
      "C": "BasicAuthentication",
      "D": "TokenAuthentication"
    },
    "correctOption": "D",
    "explanation": "DRF ning TokenAuthentication klassi standart holda 'Authorization: Token <key>' prefiksini kutadi.",
    "codeExplanation": "JWT uchun odatda 'Bearer <token>', Basic uchun 'Basic <base64>' ishlatiladi."
  },
  {
    "id": "t4-q10",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi Custom User modeli login sifatida qaysi maydondan foydalanadi?",
    "code": "class CustomUser(AbstractUser):\n    email = models.EmailField(unique=True)\n    phone = models.CharField(max_length=20, blank=True)\n\n    USERNAME_FIELD = 'email'\n    REQUIRED_FIELDS = ['username']",
    "options": {
      "A": "username maydonidan",
      "B": "phone maydonidan",
      "C": "id maydonidan",
      "D": "email maydonidan"
    },
    "correctOption": "D",
    "explanation": "USERNAME_FIELD = 'email' tizimda asosiy login identifikatori sifatida email ishlatilishini belgilaydi.",
    "codeExplanation": "Email maydoni unique=True bo‘lishi shart, REQUIRED_FIELDS esa createsuperuser da qo‘shimcha so‘raladigan maydonlardir."
  },
  {
    "id": "t4-q11",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi CustomUser modelida qanday muhim xato mavjud?",
    "code": "class CustomUser(AbstractUser):\n    email = models.EmailField()\n    USERNAME_FIELD = 'email'\n    REQUIRED_FIELDS = []",
    "options": {
      "A": "email turi CharField bo‘lishi shart",
      "B": "email maydonida unique=True qo‘yilmagan",
      "C": "AbstractUser dan meros olib bo‘lmaydi",
      "D": "REQUIRED_FIELDS bo‘sh ro‘yxat bo‘lishi mumkin emas"
    },
    "correctOption": "B",
    "explanation": "USERNAME_FIELD sifatida tanlangan maydon albatta unique=True bo‘lishi shart, aks holda Django auth.E003 tizim xatosini beradi.",
    "codeExplanation": "Login identifikatori har bir foydalanuvchi uchun noyob bo‘lishi talab qilinadi."
  },
  {
    "id": "t4-q12",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi SimpleJWT sozlamasi barcha API so‘rovlariga qanday ta'sir ko‘rsatadi?",
    "code": "REST_FRAMEWORK = {\n    'DEFAULT_AUTHENTICATION_CLASSES': (\n        'rest_framework_simplejwt.authentication.JWTAuthentication',\n    )\n}",
    "options": {
      "A": "Barcha endpointlarda CSRF tekshiruvi majburiy bo‘ladi",
      "B": "Tokenlar har 10 soniyada o‘chiriladi",
      "C": "DRF kiruvchi Authorization: Bearer tokenlarini tekshiradi",
      "D": "Barcha view lar avtomatik faqat adminlarga ochiladi"
    },
    "correctOption": "C",
    "explanation": "DEFAULT_AUTHENTICATION_CLASSES ga JWTAuthentication qo‘yilganda DRF har bir so‘rovdagi Bearer JWT ni tekshirib request.user ni aniqlaydi.",
    "codeExplanation": "Autentifikatsiya klassi faqat shaxsni aniqlaydi, ruxsat berishni esa permission klasslari hal qiladi."
  },
  {
    "id": "t4-q13",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi foydalanuvchi yaratish (register) serializerida qanday jiddiy xavfsizlik xatosi bor?",
    "code": "class RegisterSerializer(serializers.ModelSerializer):\n    class Meta:\n        model = User\n        fields = ['username', 'email', 'password']\n\n    def create(self, validated_data):\n        return User.objects.create(**validated_data)",
    "options": {
      "A": "validated_data lug‘atini ** bilan yoyib bo‘lmaydi",
      "B": "Parol xeshlanmasdan ochiq matn sifatida saqlanadi",
      "C": "ModelSerializer da create() metodini yozib bo‘lmaydi",
      "D": "email maydoni birinchi o‘rinda turishi kerak"
    },
    "correctOption": "B",
    "explanation": "User.objects.create() parolni xeshlamaydi; parolni xavfsiz xeshlash uchun User.objects.create_user() yoki set_password() ishlatilishi shart.",
    "codeExplanation": "Ochiq matnli parol bilan Django authenticate() foydalanuvchini tizimga kiritmaydi."
  },
  {
    "id": "t4-q14",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "medium",
    "category": "terms",
    "text": "AbstractUser va AbstractBaseUser o‘rtasidagi asosiy farq nima?",
    "options": {
      "A": "AbstractUser tayyor maydonlar (username, email) bilan keladi",
      "B": "AbstractBaseUser faqat admin foydalanuvchilar uchun ishlaydi",
      "C": "AbstractUser parolni xeshlash funksiyasiga ega emas",
      "D": "AbstractBaseUser Django ORM bilan bog‘lanmaydi"
    },
    "correctOption": "A",
    "explanation": "AbstractUser Django standart User maydonlarini saqlab qolib yangi maydon qo‘shishga qulay; AbstractBaseUser esa modelni deyarli noldan qurish uchun ishlatiladi."
  },
  {
    "id": "t4-q15",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi kodda 'get_user_model()' funksiyasi nega to‘g‘ridan-to‘g‘ri User importidan afzal?",
    "code": "from django.contrib.auth import get_user_model\n\nUser = get_user_model()",
    "options": {
      "A": "Parol xeshlash tezligini ikki barobar oshiradi",
      "B": "Ma'lumotlar bazasidan barcha foydalanuvchilarni o‘chiradi",
      "C": "Sozlamadagi faol AUTH_USER_MODEL ni dinamik qaytaradi",
      "D": "Faqat superuser obyektlarini filtrlab beradi"
    },
    "correctOption": "C",
    "explanation": "get_user_model() settings.AUTH_USER_MODEL da ko‘rsatilgan joriy User modelini qaytaradi, bu esa kodni Custom User bilan moslashuvchan qiladi.",
    "codeExplanation": "Modellar ichida ForeignKey uchun settings.AUTH_USER_MODEL satridan foydalanish ham tavsiya etiladi."
  },
  {
    "id": "t4-q16",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "JWT tokenning Payload qismi haqida qaysi fikr to‘g‘ri?",
    "code": "{\n  \"token_type\": \"access\",\n  \"exp\": 1735689600,\n  \"user_id\": 42\n}",
    "options": {
      "A": "Faqat serverning RAM xotirasida saqlanadi",
      "B": "Base64Url kodlangan bo‘lib, har kim dekodlay oladi",
      "C": "Ichida foydalanuvchi paroli saqlanishi shart",
      "D": "Shifrlangan bo‘lib, mijoz uni o‘qiy olmaydi"
    },
    "correctOption": "B",
    "explanation": "JWT Payload shifrlanmagan, faqat Base64Url kodlangan bo‘ladi — shuning uchun uning ichiga parol kabi maxfiy ma'lumotlar qo‘yilmaydi.",
    "codeExplanation": "Signature qismi payload o‘zgartirilmaganligini tekshiradi, lekin uni yashirmaydi."
  },
  {
    "id": "t4-q17",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Loyihada dastlabki migratsiyalar bajarilib bo‘lgach, keyin Custom User Model qo‘shilsa nima sodir bo‘ladi?",
    "code": "# Avval migrate qilingan, keyin qo‘shilgan:\nAUTH_USER_MODEL = 'accounts.CustomUser'",
    "options": {
      "A": "Eski foydalanuvchilar yangi jadvalga o‘tib qoladi",
      "B": "Django barcha jadvallarni avtomatik ko‘chirib beradi",
      "C": "Faqat admin paneli ishlamay qoladi, API ishlaydi",
      "D": "Migratsiya bog‘liqligi (InconsistentMigrationHistory) xatosi chiqadi"
    },
    "correctOption": "D",
    "explanation": "Custom User Model loyiha boshida, birinchi migrate dan oldin yaratilishi shart; aks holda admin/auth migratsiyalari bilan ziddiyat yuzaga keladi.",
    "codeExplanation": "Django rasmiy hujjatlari loyihani boshlashdayoq Custom User yaratishni qat'iy tavsiya qiladi."
  },
  {
    "id": "t4-q18",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "Foydalanuvchi tizimdan chiqqanda (logout) SimpleJWT da Refresh Tokenni yaroqsiz qilish uchun qaysi mexanizm yoqiladi?",
    "options": {
      "A": "django.contrib.sessions.flush ilovasi",
      "B": "rest_framework.authtoken.clear ilovasi",
      "C": "django.middleware.csrf.disable ilovasi",
      "D": "rest_framework_simplejwt.token_blacklist ilovasi"
    },
    "correctOption": "D",
    "explanation": "SimpleJWT ning token_blacklist ilovasi yordamida token.blacklist() chaqirilib, logout qilingan Refresh Token qayta ishlatilishi bloklanadi."
  },
  {
    "id": "t4-q19",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "Autentifikatsiya qilinmagan mijoz IsAuthenticated talab qiluvchi endpointga so‘rov yuborganda DRF qaysi status kodini qaytaradi (TokenAuthentication ulangan bo‘lsa)?",
    "options": {
      "A": "500 Internal Server Error",
      "B": "400 Bad Request",
      "C": "401 Unauthorized",
      "D": "404 Not Found"
    },
    "correctOption": "C",
    "explanation": "TokenAuthentication yoki JWTAuthentication WWW-Authenticate sarlavhasini qaytargani uchun DRF 401 Unauthorized javobini beradi."
  },
  {
    "id": "t4-q20",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "medium",
    "category": "theory",
    "text": "JWT da uchinchi qism — Signature (imzo) nima maqsadda ishlatiladi?",
    "options": {
      "A": "Header va Payload o‘zgartirilmaganini tekshirish uchun",
      "B": "Foydalanuvchi ruxsatlarini saqlash uchun",
      "C": "Baza so‘rovlarini keshlash uchun",
      "D": "Token hajmini siqib kichraytirish uchun"
    },
    "correctOption": "A",
    "explanation": "Signature serverning maxfiy kaliti bilan hisoblanadi va token yo‘lda soxtalashtirilmaganini kafolatlaydi."
  },
  {
    "id": "t4-q21",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Quyidagi SimpleJWT sozlamalarida Access Token va Refresh Token qancha vaqt amal qiladi?",
    "code": "from datetime import timedelta\n\nSIMPLE_JWT = {\n    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),\n    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),\n    'ROTATE_REFRESH_TOKENS': True,\n}",
    "options": {
      "A": "Access 7 kun, Refresh 15 daqiqa",
      "B": "Ikkalasi ham 15 daqiqada tugaydi",
      "C": "Tokenlar muddati cheksiz bo‘ladi",
      "D": "Access 15 daqiqa, Refresh 7 kun va yangilanadi"
    },
    "correctOption": "D",
    "explanation": "Access token 15 daqiqa, Refresh token 7 kun amal qiladi; ROTATE_REFRESH_TOKENS=True esa har yangilanishda yangi Refresh token ham beradi.",
    "codeExplanation": "ROTATE_REFRESH_TOKENS bilan BLACKLIST_AFTER_ROTATION=True birga qo‘llanilsa xavfsizlik yanada kuchayadi."
  },
  {
    "id": "t4-q22",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Quyidagi endpointga noto‘g‘ri parol yuborilsa qaysi status kodi qaytadi?",
    "code": "from rest_framework_simplejwt.views import TokenObtainPairView\n\nurlpatterns = [\n    path('api/token/', TokenObtainPairView.as_view()),\n]",
    "options": {
      "A": "401 Unauthorized",
      "B": "403 Forbidden",
      "C": "404 Not Found",
      "D": "204 No Content"
    },
    "correctOption": "A",
    "explanation": "TokenObtainPairView da login yoki parol noto‘g‘ri bo‘lsa AuthenticationFailed tashlanadi va 401 Unauthorized qaytadi.",
    "codeExplanation": "To‘g‘ri ma'lumot yuborilganda esa 200 OK bilan access va refresh tokenlar qaytadi."
  },
  {
    "id": "t4-q23",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "hard",
    "category": "bug_finding",
    "text": "Quyidagi view da authentication_classes = [SessionAuthentication] yozilgan, lekin POST so‘rovda 403 CSRF xatosi chiqmoqda. Sababi nima?",
    "code": "class OrderCreateView(APIView):\n    authentication_classes = [SessionAuthentication]\n    permission_classes = [IsAuthenticated]\n\n    def post(self, request):\n        return Response({'ok': True})",
    "options": {
      "A": "SessionAuthentication POST so‘rovda CSRF token talab qiladi",
      "B": "APIView da POST metodiga ruxsat berilmagan",
      "C": "IsAuthenticated faqat GET uchun ishlaydi",
      "D": "SessionAuthentication faqat superuserga ochiq"
    },
    "correctOption": "A",
    "explanation": "DRF ning SessionAuthentication klassi autentifikatsiya qilingan foydalanuvchilar uchun barcha xavfsiz bo‘lmagan (POST/PUT/DELETE) so‘rovlarda CSRF tokenini majburiy tekshiradi.",
    "codeExplanation": "So‘rovda X-CSRFToken sarlavhasi yuborilishi yoki SPA uchun JWT ishlatilishi kerak."
  },
  {
    "id": "t4-q24",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "DRF da bir nechta authentication_classes berilganda (masalan, [JWTAuthentication, SessionAuthentication]), DRF ularni qanday tartibda tekshiradi?",
    "options": {
      "A": "Har doim faqat oxirgi klassni ishga tushiradi",
      "B": "Ro‘yxat tartibida tekshirib, birinchi muvaffaqiyatlisini oladi",
      "C": "Barcha klasslar birdaniga muvaffaqiyatli bo‘lishini kutadi",
      "D": "Tasodifiy bitta klassni tanlab tekshiradi"
    },
    "correctOption": "B",
    "explanation": "DRF authentication_classes ro‘yxatini boshidan oxirigacha aylanadi va birinchi bo‘lib (user, auth) juftligini qaytargan klass natijasini o‘rnatadi."
  },
  {
    "id": "t4-q25",
    "topicId": "topic-4",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "Ommaviy (public) login endpointi global JWT autentifikatsiyasidan mustasno bo‘lishi uchun view da nima sozlanadi?",
    "options": {
      "A": "permission_classes=[IsAdminUser] va authentication_classes=[]",
      "B": "permission_classes=[AllowAny] va authentication_classes=[]",
      "C": "settings.py da DEBUG=True va ALLOWED_HOSTS=['*'] yozish",
      "D": "authentication_classes=[BasicAuthentication] deb o‘rnatish"
    },
    "correctOption": "B",
    "explanation": "authentication_classes = [] va permission_classes = [AllowAny] eskirgan token bilan kelgan mijozning ham login endpointiga kira olishini ta'minlaydi."
  },
  {
    "id": "t4-q26",
    "topicId": "topic-4",
    "type": "open",
    "difficulty": "easy",
    "category": "terms",
    "text": "SimpleJWT da Authorization sarlavhasida token oldidan yoziladigan standart kalit so‘zni (prefiksni) yozing.",
    "acceptedAnswers": [
      "Bearer",
      "bearer"
    ],
    "requiresMentorReview": false,
    "explanation": "JWT tokenlar standart holda 'Authorization: Bearer <access_token>' ko‘rinishida yuboriladi."
  },
  {
    "id": "t4-q27",
    "topicId": "topic-4",
    "type": "open",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "DRF da autentifikatsiyadan o‘tgan joriy foydalanuvchi obyektini view ichida olish uchun ishlatiladigan ifodani yozing.",
    "code": "def get(self, request):\n    current_user = ________\n    return Response({'username': current_user.username})",
    "acceptedAnswers": [
      "request.user"
    ],
    "requiresMentorReview": false,
    "explanation": "Muvaffaqiyatli autentifikatsiyadan so‘ng DRF joriy foydalanuvchi model obyektini request.user ga joylashtiradi.",
    "codeExplanation": "Autentifikatsiya qilinmagan so‘rovlarda request.user qiymati AnonymousUser bo‘ladi."
  },
  {
    "id": "t4-q28",
    "topicId": "topic-4",
    "type": "open",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi kodda parolni to‘g‘ri xeshlab saqlash uchun User.objects.create o‘rniga qaysi manager metodi ishlatilishi kerak?",
    "code": "user = User.objects.create(username='ali', password='secret123')",
    "acceptedAnswers": [
      "create_user",
      "User.objects.create_user"
    ],
    "requiresMentorReview": false,
    "explanation": "User.objects.create_user() parolni avtomatik set_password() orqali xeshlab saqlaydi.",
    "codeExplanation": "Oddiy create() parolni ochiq matn sifatida yozib qo‘yadi."
  },
  {
    "id": "t4-q29",
    "topicId": "topic-4",
    "type": "open",
    "difficulty": "medium",
    "category": "theory",
    "text": "TokenAuthentication va JWTAuthentication o‘rtasidagi asosiy saqlash va tekshirish farqini qisqacha tushuntiring.",
    "acceptedAnswers": [
      "token bazada saqlanadi jwt stateless imzo orqali tekshiriladi",
      "token bazadan tekshiriladi jwt bazasiz tekshiriladi"
    ],
    "requiresMentorReview": true,
    "explanation": "Oddiy Token bazada saqlanadi va har so‘rovda bazadan tekshiriladi; JWT esa stateless bo‘lib, server uni bazaga murojaat qilmasdan kriptografik imzo orqali tekshiradi."
  },
  {
    "id": "t4-q30",
    "topicId": "topic-4",
    "type": "open",
    "difficulty": "hard",
    "category": "practical",
    "text": "JWT tokenning 3 ta qismini nuqta bilan ajratib ingliz tilida yozing (masalan: A.B.C).",
    "acceptedAnswers": [
      "Header.Payload.Signature",
      "header.payload.signature"
    ],
    "requiresMentorReview": false,
    "explanation": "Har bir JWT token Header.Payload.Signature tuzilishiga ega."
  },
  {
    "id": "t5-q1",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "Django REST Framework da Permission (ruxsat) tizimining asosiy vazifasi nima?",
    "options": {
      "A": "Foydalanuvchining parolini xeshlab saqlash",
      "B": "So‘rov bajarilishiga ruxsat bor-yo‘qligini hal qilish",
      "C": "JSON ma'lumotlarni XML formatiga o‘girish",
      "D": "URL manzillarni routerda ro‘yxatga olish"
    },
    "correctOption": "B",
    "explanation": "Permissions autentifikatsiyadan keyin ishga tushib, joriy foydalanuvchi ushbu endpoint yoki obyekt ustida amal bajara olishini tekshiradi."
  },
  {
    "id": "t5-q2",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "DRF da barcha foydalanuvchilarga (kirgan va kirmagan) cheklovsiz ruxsat beruvchi standart klass qaysi?",
    "options": {
      "A": "IsAuthenticated",
      "B": "AllowAny",
      "C": "IsAdminUser",
      "D": "DjangoModelPermissions"
    },
    "correctOption": "B",
    "explanation": "AllowAny autentifikatsiya holatidan qat'i nazar barcha so‘rovlarga ruxsat beradi."
  },
  {
    "id": "t5-q3",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "IsAdminUser ruxsat klassi foydalanuvchining qaysi atributi True bo‘lganda ruxsat beradi?",
    "options": {
      "A": "user.is_active",
      "B": "user.is_verified",
      "C": "user.is_authenticated",
      "D": "user.is_staff"
    },
    "correctOption": "D",
    "explanation": "DRF ning IsAdminUser klassi bool(request.user and request.user.is_staff) shartini tekshiradi."
  },
  {
    "id": "t5-q4",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "IsAuthenticatedOrReadOnly klassi anonim (login qilmagan) foydalanuvchilarga qaysi metodlarga ruxsat beradi?",
    "options": {
      "A": "Hech qanday HTTP metodga ruxsat bermaydi",
      "B": "Faqat POST va DELETE metodlariga",
      "C": "Faqat PUT va PATCH metodlariga",
      "D": "Faqat xavfsiz metodlarga (GET, HEAD, OPTIONS)"
    },
    "correctOption": "D",
    "explanation": "IsAuthenticatedOrReadOnly SAFE_METHODS (GET, HEAD, OPTIONS) uchun hamma foydalanuvchiga, yozish uchun esa faqat autentifikatsiya qilinganlarga ruxsat beradi."
  },
  {
    "id": "t5-q5",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "Authentication va Permission ning bajarilish tartibi qanday?",
    "options": {
      "A": "Avval Authentication, keyin Permission ishlaydi",
      "B": "Ikkalasi ham faqat javob qaytishida ishlaydi",
      "C": "Ular bir-birining o‘rnini to‘liq bosadi",
      "D": "Avval Permission, keyin Authentication ishlaydi"
    },
    "correctOption": "A",
    "explanation": "DRF avval request.user ni aniqlaydi (Authentication), so‘ngra shu foydalanuvchining huquqlarini tekshiradi (Permission)."
  },
  {
    "id": "t5-q6",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "DRF da maxsus (custom) permission klassi qaysi bazaviy klassdan meros oladi?",
    "options": {
      "A": "serializers.BaseSerializer",
      "B": "permissions.BasePermission",
      "C": "views.APIView",
      "D": "models.Model"
    },
    "correctOption": "B",
    "explanation": "Barcha maxsus ruxsat klasslari rest_framework.permissions.BasePermission dan meros olib yoziladi."
  },
  {
    "id": "t5-q7",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "Autentifikatsiyadan o‘tgan foydalanuvchiga ruxsat rad etilsa, DRF qaysi HTTP status kodini qaytaradi?",
    "options": {
      "A": "401 Unauthorized",
      "B": "404 Not Found",
      "C": "403 Forbidden",
      "D": "405 Method Not Allowed"
    },
    "correctOption": "C",
    "explanation": "Foydalanuvchi tizimga kirgan, ammo ushbu amalga huquqi bo‘lmasa 403 Forbidden status kodi qaytariladi."
  },
  {
    "id": "t5-q8",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "easy",
    "category": "practical",
    "text": "Loyihaning barcha endpointlarini sukut bo‘yicha faqat login qilgan foydalanuvchilar uchun yopiq qilish qayerda sozlanadi?",
    "options": {
      "A": "DATABASES['default']['PERMISSIONS'] da",
      "B": "TEMPLATES['OPTIONS']['permissions'] da",
      "C": "REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES'] da",
      "D": "STATICFILES_DIRS ro‘yxatida"
    },
    "correctOption": "C",
    "explanation": "settings.py dagi REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES'] butun loyiha uchun global ruxsat qoidasini belgilaydi."
  },
  {
    "id": "t5-q9",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi custom permission klassi qaysi foydalanuvchilarga obyekt ustida yozish (PUT/DELETE) ruxsatini beradi?",
    "code": "class IsOwnerOrReadOnly(BasePermission):\n    def has_object_permission(self, request, view, obj):\n        if request.method in SAFE_METHODS:\n            return True\n        return obj.owner == request.user",
    "options": {
      "A": "Faqat anonim foydalanuvchilarga",
      "B": "Hech kimga yozishga ruxsat bermaydi",
      "C": "Tizimga kirgan barcha foydalanuvchilarga",
      "D": "Faqat obyektni yaratgan egasiga (obj.owner)"
    },
    "correctOption": "D",
    "explanation": "SAFE_METHODS bo‘lmagan so‘rovlarda obj.owner == request.user sharti tekshiriladi, ya'ni faqat obyekt egasi o‘zgartira oladi.",
    "codeExplanation": "GET, HEAD, OPTIONS barcha uchun ochiq; POST/PUT/PATCH/DELETE esa faqat egasi uchun True qaytaradi."
  },
  {
    "id": "t5-q10",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi ViewSet da 'destroy' (DELETE) amali uchun qaysi ruxsat klassi qo‘llaniladi?",
    "code": "class CourseViewSet(viewsets.ModelViewSet):\n    queryset = Course.objects.all()\n    serializer_class = CourseSerializer\n\n    def get_permissions(self):\n        if self.action == 'destroy':\n            return [IsAdminUser()]\n        return [IsAuthenticated()]",
    "options": {
      "A": "AllowAny",
      "B": "IsAuthenticated",
      "C": "IsAdminUser",
      "D": "IsAuthenticatedOrReadOnly"
    },
    "correctOption": "C",
    "explanation": "get_permissions() metodida self.action == 'destroy' tekshirilganda IsAdminUser() qaytariladi, boshqa barcha amallarda IsAuthenticated() ishlaydi.",
    "codeExplanation": "E'tibor bering: get_permissions() klass emas, klass obyektlari ro‘yxatini ([IsAdminUser()]) qaytarishi shart."
  },
  {
    "id": "t5-q11",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi get_permissions() metodida qanday sintaktik/mantiqiy xato mavjud?",
    "code": "def get_permissions(self):\n    if self.action == 'list':\n        return [AllowAny]\n    return [IsAuthenticated]",
    "options": {
      "A": "self.action o‘rniga self.method yozilishi kerak",
      "B": "get_permissions() faqat bitta klass qaytarishi kerak",
      "C": "Klasslar instansiya qilinmagan: AllowAny() va IsAuthenticated() kerak",
      "D": "AllowAny ViewSet ichida ishlatilmaydi"
    },
    "correctOption": "C",
    "explanation": "permission_classes atributi klasslarni qabul qiladi, lekin get_permissions() metodi ularning instansiyalarini ([AllowAny()]) qaytarishi shart.",
    "codeExplanation": "Qavslarsiz qaytarilsa TypeError: has_permission() missing 1 required positional argument chiqadi."
  },
  {
    "id": "t5-q12",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi view da ikkita ruxsat klassi berilgan. So‘rov o‘tishi uchun qanday shart bajarilishi kerak?",
    "code": "class ReportView(APIView):\n    permission_classes = [IsAuthenticated, IsMentorUser]",
    "options": {
      "A": "Faqat birinchi klass True qaytarishi yetarli",
      "B": "Faqat ikkinchi klass tekshiriladi",
      "C": "Ikkalasidan istalgan biri True qaytarsa yetarli",
      "D": "Ikkala klass ham True qaytarishi shart (AND)"
    },
    "correctOption": "D",
    "explanation": "permission_classes ro‘yxatidagi barcha klasslar mantiqiy AND bilan tekshiriladi — bittasi False qaytarsa so‘rov rad etiladi.",
    "codeExplanation": "OR mantiqi kerak bo‘lsa DRF 3.9+ dagi bitwise operator (IsAdminUser | IsMentorUser) ishlatiladi."
  },
  {
    "id": "t5-q13",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi APIView da has_object_permission() nega ishga tushmayapti?",
    "code": "class BookDetailView(APIView):\n    permission_classes = [IsOwnerOrReadOnly]\n\n    def get(self, request, pk):\n        book = get_object_or_404(Book, pk=pk)\n        return Response(BookSerializer(book).data)",
    "options": {
      "A": "self.check_object_permissions(request, book) chaqirilmagan",
      "B": "APIView da permission_classes umuman ishlamaydi",
      "C": "get_object_or_404 DRF bilan mos kelmaydi",
      "D": "IsOwnerOrReadOnly faqat POST da ishlaydi"
    },
    "correctOption": "A",
    "explanation": "GenericAPIView da get_object() buni avtomatik bajaradi, lekin oddiy APIView da obyektni olgach self.check_object_permissions(request, obj) qo‘lda chaqirilishi shart.",
    "codeExplanation": "Chaqirilmasa faqat has_permission() ishlaydi, obyekt darajasidagi tekshiruv o‘tkazib yuboriladi."
  },
  {
    "id": "t5-q14",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "medium",
    "category": "terms",
    "text": "has_permission() va has_object_permission() metodlari qachon chaqiriladi?",
    "options": {
      "A": "has_object_permission har doim has_permission dan oldin",
      "B": "has_permission har so‘rovda, has_object_permission detal obyektda",
      "C": "Ikkalasi ham faqat list (GET) so‘rovlarida",
      "D": "has_permission faqat POST da, ikkinchisi faqat DELETE da"
    },
    "correctOption": "B",
    "explanation": "has_permission() har bir so‘rov boshida, has_object_permission() esa aniq bitta obyekt (retrieve, update, destroy) olinganda chaqiriladi."
  },
  {
    "id": "t5-q15",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi funksiya asosidagi view ga ruxsat qo‘yish qanday bajarilgan?",
    "code": "from rest_framework.decorators import api_view, permission_classes\nfrom rest_framework.permissions import IsAuthenticated\n\n@api_view(['GET'])\n@permission_classes([IsAuthenticated])\ndef secret_stats(request):\n    return Response({'count': 120})",
    "options": {
      "A": "@permission_classes @api_view dan yuqorida turishi shart",
      "B": "Funksiya view larda permission ishlatib bo‘lmaydi",
      "C": "@permission_classes dekoratori bilan to‘g‘ri ulangan",
      "D": "IsAuthenticated qavs bilan chaqirilishi kerak"
    },
    "correctOption": "C",
    "explanation": "Funksiya view larda @api_view eng yuqorida, @permission_classes esa uning ostida yozilishi to‘g‘ri tartibdir.",
    "codeExplanation": "Agar @permission_classes yuqoriga qo‘yilsa, @api_view uni tanimay qoladi."
  },
  {
    "id": "t5-q16",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi ruxsat ifodasi qaysi foydalanuvchilarga ruxsat beradi?",
    "code": "class ExamResultView(APIView):\n    permission_classes = [IsAdminUser | IsMentorUser]",
    "options": {
      "A": "Faqat ham admin, ham mentor bo‘lganlarga",
      "B": "Na admin, na mentor bo‘lmaganlarga",
      "C": "Barcha anonim foydalanuvchilarga",
      "D": "Admin YOKI mentor bo‘lgan foydalanuvchilarga"
    },
    "correctOption": "D",
    "explanation": "DRF da bitwise | (OR) operatori ruxsat klasslarini birlashtiradi: ikkalasidan biri True qaytarsa ruxsat beriladi.",
    "codeExplanation": "& operatori AND, ~ operatori esa NOT mantiqini beradi."
  },
  {
    "id": "t5-q17",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi custom permission da anonim foydalanuvchi kirganda qanday xato yuzaga kelishi mumkin?",
    "code": "class IsMentor(BasePermission):\n    def has_permission(self, request, view):\n        return request.user.role == 'mentor'",
    "options": {
      "A": "Satr qiymatlarini == operatori bilan solishtirib bo‘lmaydi",
      "B": "has_permission() metodi 4 ta argument qabul qilishi shart",
      "C": "request.user obyekti DRF view larda mavjud bo‘lmaydi",
      "D": "AnonymousUser da role yo‘qligi uchun AttributeError chiqadi"
    },
    "correctOption": "D",
    "explanation": "Login qilmagan so‘rovlarda request.user AnonymousUser bo‘ladi va unda custom 'role' maydoni bo‘lmaydi; avval request.user.is_authenticated tekshirilishi shart.",
    "codeExplanation": "To‘g‘ri yozilishi: return bool(request.user and request.user.is_authenticated and request.user.role == 'mentor')."
  },
  {
    "id": "t5-q18",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "Agar has_permission() metodi False qaytarsa, DRF has_object_permission() metodini chaqiradimi?",
    "options": {
      "A": "Yo‘q, so‘rov darhol rad etiladi",
      "B": "Ha, baribir chaqiradi",
      "C": "Faqat GET so‘rovlarida chaqiradi",
      "D": "Faqat DEBUG=True holatida chaqiradi"
    },
    "correctOption": "A",
    "explanation": "has_permission() False qaytarsa, DRF tekshiruvni darhol to‘xtatadi va has_object_permission() ga o‘tmaydi."
  },
  {
    "id": "t5-q19",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "Global sozlamada IsAuthenticated yoqilgan, ammo bitta 'RegisterView' hamma uchun ochiq bo‘lishi kerak. Buni qanday hal qilasiz?",
    "options": {
      "A": "Global sozlamani AllowAny ga o‘zgartirish orqali",
      "B": "RegisterView ichida permission_classes = [AllowAny] yozish orqali",
      "C": "RegisterView ni Django admin ichiga ko‘chirish orqali",
      "D": "URL manziliga ?public=true qo‘shish orqali"
    },
    "correctOption": "B",
    "explanation": "View darajasidagi permission_classes har doim global DEFAULT_PERMISSION_CLASSES sozlamasini ustidan yozadi (override)."
  },
  {
    "id": "t5-q20",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "medium",
    "category": "theory",
    "text": "Custom permission rad etilganda mijozga tushunarli maxsus xato matni qaytarish uchun klassda qaysi atribut belgilanadi?",
    "options": {
      "A": "error_text",
      "B": "detail_info",
      "C": "status_note",
      "D": "message"
    },
    "correctOption": "D",
    "explanation": "BasePermission voris klassida message = 'Sizda bu amalni bajarish huquqi yo‘q' atributi 403 javobidagi detail matnini o‘zgartiradi."
  },
  {
    "id": "t5-q21",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Quyidagi list endpointiga (GET /api/orders/) so‘rov kelganda has_object_permission() necha marta chaqiriladi?",
    "code": "class OrderViewSet(viewsets.ModelViewSet):\n    queryset = Order.objects.all()\n    serializer_class = OrderSerializer\n    permission_classes = [IsOrderOwner]",
    "options": {
      "A": "Umuman chaqirilmaydi (0 marta)",
      "B": "Faqat sahifadagi oxirgi obyekt uchun",
      "C": "Har bir buyurtma uchun alohida chaqiriladi",
      "D": "Faqat birinchi obyekt uchun 1 marta"
    },
    "correctOption": "A",
    "explanation": "DRF samaradorlik sababli list (ro‘yxat) ko‘rinishida has_object_permission() ni chaqirmaydi; ro‘yxatni cheklash uchun get_queryset() da filtrlash kerak.",
    "codeExplanation": "has_object_permission() faqat get_object() orqali olinadigan detal endpointlarda ishlaydi."
  },
  {
    "id": "t5-q22",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Quyidagi @action dekoratorida permission_classes ko‘rsatilganda nima sodir bo‘ladi?",
    "code": "class CourseViewSet(viewsets.ModelViewSet):\n    permission_classes = [IsAuthenticated]\n\n    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])\n    def archive(self, request, pk=None):\n        return Response({'archived': True})",
    "options": {
      "A": "archive endpointi ham IsAuthenticated, ham IsAdminUser talab qiladi",
      "B": "@action da permission_classes parametri qo‘llab-quvvatlanmaydi",
      "C": "archive endpointi faqat IsAdminUser ruxsati bilan ishlaydi",
      "D": "Butun ViewSet ruxsati IsAdminUser ga o‘zgarib qoladi"
    },
    "correctOption": "C",
    "explanation": "@action dekoratoriga berilgan permission_classes aynan o‘sha qo‘shimcha endpoint uchun ViewSet ruxsatini almashtiradi.",
    "codeExplanation": "Bu bitta ViewSet ichida alohida action lar uchun turli ruxsatlar berishning eng toza usuli."
  },
  {
    "id": "t5-q23",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "hard",
    "category": "bug_finding",
    "text": "Quyidagi custom permission da POST (yaratish) so‘rovi bilan bog‘liq qanday xato qarash bor?",
    "code": "class CanCreateCourse(BasePermission):\n    def has_object_permission(self, request, view, obj):\n        if request.method == 'POST':\n            return request.user.is_mentor\n        return True",
    "options": {
      "A": "POST da obyekt hali mavjud emas, has_object_permission chaqirilmaydi",
      "B": "POST metodini request.method bilan tekshirib bo‘lmaydi",
      "C": "has_object_permission faqat False qaytarishi mumkin",
      "D": "view parametri o‘rniga model yozilishi shart"
    },
    "correctOption": "A",
    "explanation": "POST orqali yangi obyekt yaratilayotganda obyekt hali bazada bo‘lmaydi, shuning uchun has_object_permission() chaqirilmaydi — POST tekshiruvi has_permission() da bo‘lishi kerak.",
    "codeExplanation": "Yaratish ruxsati doim view darajasida (has_permission) tekshiriladi."
  },
  {
    "id": "t5-q24",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "Talaba faqat o‘zining topshiriqlarini ko‘rishi (GET /api/submissions/) va tahrirlashi uchun eng xavfsiz yechim qaysi?",
    "options": {
      "A": "Faqat frontend da boshqa talabalarni yashirish",
      "B": "get_queryset() da user bo‘yicha filtrlash va IsOwner permission",
      "C": "AllowAny qo‘yib URL da user_id so‘rash",
      "D": "Faqat IsAuthenticatedOrReadOnly ishlatish"
    },
    "correctOption": "B",
    "explanation": "get_queryset() ro‘yxatda begona ma'lumotlar chiqishini to‘sadi, object-level permission esa detal amallarini himoyalaydi."
  },
  {
    "id": "t5-q25",
    "topicId": "topic-5",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "Django ning standart admin guruh va model ruxsatlarini (add, change, delete) DRF API ga avtomatik tatbiq etuvchi klass qaysi?",
    "options": {
      "A": "DjangoModelPermissions",
      "B": "AllowAny",
      "C": "IsAuthenticated",
      "D": "BasePermission"
    },
    "correctOption": "A",
    "explanation": "DjangoModelPermissions foydalanuvchining Django auth model ruxsatlarini (app.add_model, app.change_model, app.delete_model) HTTP metodlarga bog‘laydi."
  },
  {
    "id": "t5-q26",
    "topicId": "topic-5",
    "type": "open",
    "difficulty": "easy",
    "category": "terms",
    "text": "DRF da faqat o‘qish uchun xavfsiz HTTP metodlar to‘plamini saqlovchi konstanta nomini yozing (katta harflarda).",
    "acceptedAnswers": [
      "SAFE_METHODS"
    ],
    "requiresMentorReview": false,
    "explanation": "rest_framework.permissions.SAFE_METHODS qiymati ('GET', 'HEAD', 'OPTIONS') dan iborat."
  },
  {
    "id": "t5-q27",
    "topicId": "topic-5",
    "type": "open",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi custom permission klassida aniq bitta obyektga ruxsatni tekshiruvchi metod nomini yozing.",
    "code": "class IsAuthor(BasePermission):\n    def ________(self, request, view, obj):\n        return obj.author == request.user",
    "acceptedAnswers": [
      "has_object_permission"
    ],
    "requiresMentorReview": false,
    "explanation": "Obyekt darajasidagi ruxsatlarni tekshirish uchun has_object_permission(self, request, view, obj) metodi yoziladi.",
    "codeExplanation": "Bu metod obj parametrini qabul qilib True yoki False qaytaradi."
  },
  {
    "id": "t5-q28",
    "topicId": "topic-5",
    "type": "open",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Oddiy APIView ichida has_object_permission() ishlashi uchun qo‘lda chaqirilishi shart bo‘lgan self metodining nomini yozing.",
    "code": "obj = get_object_or_404(Article, pk=pk)\nself.________(request, obj)",
    "acceptedAnswers": [
      "check_object_permissions"
    ],
    "requiresMentorReview": false,
    "explanation": "APIView ichida obyekt darajasidagi ruxsatlarni ishga tushirish uchun self.check_object_permissions(request, obj) chaqiriladi.",
    "codeExplanation": "Ruxsat rad etilsa ushbu metod PermissionDenied istisnosini tashlaydi."
  },
  {
    "id": "t5-q29",
    "topicId": "topic-5",
    "type": "open",
    "difficulty": "medium",
    "category": "theory",
    "text": "has_permission() va has_object_permission() metodlari o‘rtasidagi farqni qisqacha tushuntiring.",
    "acceptedAnswers": [
      "has_permission view darajasida has_object_permission obyekt darajasida tekshiradi"
    ],
    "requiresMentorReview": true,
    "explanation": "has_permission() har bir so‘rovda umumiy view kirishini tekshiradi; has_object_permission() esa aniq bitta model obyekti olinganda (detal amallarda) tekshiriladi."
  },
  {
    "id": "t5-q30",
    "topicId": "topic-5",
    "type": "open",
    "difficulty": "hard",
    "category": "practical",
    "text": "settings.py da barcha API lar uchun standart ruxsatlarni belgilovchi REST_FRAMEWORK lug‘at kaliti nomini yozing.",
    "acceptedAnswers": [
      "DEFAULT_PERMISSION_CLASSES",
      "'DEFAULT_PERMISSION_CLASSES'"
    ],
    "requiresMentorReview": false,
    "explanation": "DEFAULT_PERMISSION_CLASSES barcha DRF view lar uchun sukut bo‘yicha qo‘llaniladigan ruxsat klasslari ro‘yxatini belgilaydi."
  },
  {
    "id": "t6-q1",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "DRF da filtrlash, qidiruv va tartiblash parametrlarini mijoz serverga odatda qaysi ko‘rinishda yuboradi?",
    "options": {
      "A": "URL query parametrlari orqali (?key=value)",
      "B": "HTTP Cookie fayllari ichida",
      "C": "Multipart fayl yuklash shaklida",
      "D": "Authorization sarlavhasi ichida"
    },
    "correctOption": "A",
    "explanation": "GET so‘rovlarida filtrlash, qidiruv va saralash URL query parametrlari (?category=2&search=drf&ordering=-price) orqali yuboriladi."
  },
  {
    "id": "t6-q2",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "DRF da matn bo‘yicha qidiruvni (masalan, ?search=django) yoqish uchun qaysi filter backend ishlatiladi?",
    "options": {
      "A": "DjangoFilterBackend",
      "B": "BaseFilterBackend",
      "C": "OrderingFilter",
      "D": "SearchFilter"
    },
    "correctOption": "D",
    "explanation": "rest_framework.filters.SearchFilter klassi search_fields asosida ?search= query parametri bo‘yicha qidiruvni ta'minlaydi."
  },
  {
    "id": "t6-q3",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "OrderingFilter bilan natijalarni narx bo‘yicha kamayish (eng qimmatidan arzoniga) tartibida olish uchun qaysi URL to‘g‘ri?",
    "options": {
      "A": "/api/courses/?ordering=price_desc",
      "B": "/api/courses/?ordering=-price",
      "C": "/api/courses/?ordering=!price",
      "D": "/api/courses/?ordering=desc(price)"
    },
    "correctOption": "B",
    "explanation": "OrderingFilter da maydon nomi oldidan minus (-) belgisi qo‘yilsa kamayish (DESC) tartibida saralanadi."
  },
  {
    "id": "t6-q4",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "DjangoFilterBackend dan foydalanish uchun qaysi tashqi kutubxona o‘rnatilishi kerak?",
    "options": {
      "A": "drf-ordering",
      "B": "django-search",
      "C": "django-query",
      "D": "django-filter"
    },
    "correctOption": "D",
    "explanation": "DjangoFilterBackend kutubxonasi alohida pip install django-filter orqali o‘rnatiladi va INSTALLED_APPS ga 'django_filters' qo‘shiladi."
  },
  {
    "id": "t6-q5",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "SearchFilter qaysi maydonlar bo‘yicha qidiruv olib borishini view da qaysi atribut belgilaydi?",
    "options": {
      "A": "filter_fields",
      "B": "query_fields",
      "C": "lookup_fields",
      "D": "search_fields"
    },
    "correctOption": "D",
    "explanation": "View yoki ViewSet da search_fields = ['title', 'description'] atributi qidiruv bajariladigan maydonlarni aniqlaydi."
  },
  {
    "id": "t6-q6",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "ViewSet da bir nechta filtrlash backendlarini (masalan, DjangoFilterBackend va SearchFilter) ulash uchun qaysi atribut ishlatiladi?",
    "options": {
      "A": "search_backends",
      "B": "filter_backends",
      "C": "filter_classes",
      "D": "query_backends"
    },
    "correctOption": "B",
    "explanation": "filter_backends ro‘yxatida barcha kerakli backend klasslari (DjangoFilterBackend, SearchFilter, OrderingFilter) birgalikda beriladi."
  },
  {
    "id": "t6-q7",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "OrderingFilter da foydalanuvchiga faqat ruxsat etilgan ustunlar bo‘yicha saralashga imkon beruvchi atribut qaysi?",
    "options": {
      "A": "ordering_fields",
      "B": "sort_columns",
      "C": "allowed_orders",
      "D": "order_by_list"
    },
    "correctOption": "A",
    "explanation": "ordering_fields = ['price', 'created_at'] xavfsizlik uchun faqat ko‘rsatilgan maydonlar bo‘yicha saralashga ruxsat beradi."
  },
  {
    "id": "t6-q8",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "easy",
    "category": "practical",
    "text": "Bir vaqtning o‘zida kategoriya bo‘yicha filtrlash, matn qidirish va narx bo‘yicha saralash uchun qaysi URL to‘g‘ri tuzilgan?",
    "options": {
      "A": "/api/courses/?category=1?search=drf?ordering=price",
      "B": "/api/courses/&category=1&search=drf&ordering=price",
      "C": "/api/courses/?category=1&search=drf&ordering=price",
      "D": "/api/courses/?category=1;search=drf;ordering=price"
    },
    "correctOption": "C",
    "explanation": "URL query parametrlari ? belgisi bilan boshlanadi va bir nechta parametrlar & belgisi bilan ajratiladi."
  },
  {
    "id": "t6-q9",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi ViewSet da 'ordering = ['-created_at']' atributi nimani belgilaydi?",
    "code": "class CourseViewSet(viewsets.ModelViewSet):\n    queryset = Course.objects.all()\n    serializer_class = CourseSerializer\n    filter_backends = [OrderingFilter]\n    ordering_fields = ['price', 'created_at']\n    ordering = ['-created_at']",
    "options": {
      "A": "created_at bo‘yicha saralashni taqiqlaydi",
      "B": "URL da ordering berilmasa standart saralashni beradi",
      "C": "Faqat 1 ta eng yangi kursni qaytaradi",
      "D": "price bo‘yicha saralashni bekor qiladi"
    },
    "correctOption": "B",
    "explanation": "ordering atributi mijoz ?ordering= parametrini yubormagan hollarda sukut bo‘yicha qo‘llaniladigan tartibni belgilaydi.",
    "codeExplanation": "Mijoz ?ordering=price yuborsa narx bo‘yicha, hech narsa yubormasa -created_at bo‘yicha qaytadi."
  },
  {
    "id": "t6-q10",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi search_fields da '^' va '=' prefikslari qanday qidiruv turini bildiradi?",
    "code": "search_fields = ['^title', '=code', 'description']",
    "options": {
      "A": "^ regex qidiruv, = faqat bosh harf mosligi",
      "B": "^ boshlanishi (istartswith), = aniq moslik (iexact)",
      "C": "^ katta harflar, = raqamlar bo‘yicha qidiruv",
      "D": "^ inkor qilish, = qisman moslik qidiruvi"
    },
    "correctOption": "B",
    "explanation": "DRF SearchFilter da '^' istartswith (boshlanishi), '=' iexact (aniq moslik), '$' regex, prefikssiz esa icontains ni anglatadi.",
    "codeExplanation": "title boshidan mos kelishi, code to‘liq teng bo‘lishi, description ichida qatnashishi tekshiriladi."
  },
  {
    "id": "t6-q11",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi ViewSet da ?category=2 so‘rovi yuborilsa ham filtrlash ishlamayapti. Xato qayerda?",
    "code": "class ProductViewSet(viewsets.ModelViewSet):\n    queryset = Product.objects.all()\n    serializer_class = ProductSerializer\n    filterset_fields = ['category', 'in_stock']",
    "options": {
      "A": "filter_backends da DjangoFilterBackend ulanmagan",
      "B": "filterset_fields o‘rniga search_fields kerak",
      "C": "ModelViewSet da filtrlash qo‘llab-quvvatlanmaydi",
      "D": "in_stock boolean maydonini filtrlab bo‘lmaydi"
    },
    "correctOption": "A",
    "explanation": "Agar settings.py da global DEFAULT_FILTER_BACKENDS yoqilmagan bo‘lsa, view da filter_backends = [DjangoFilterBackend] ko‘rsatilishi shart.",
    "codeExplanation": "Backend ulanmasa filterset_fields atributi e'tiborsiz qoladi."
  },
  {
    "id": "t6-q12",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi FilterSet klassi qaysi URL so‘rovlarini qo‘llab-quvvatlaydi?",
    "code": "import django_filters\n\nclass CourseFilter(django_filters.FilterSet):\n    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')\n    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')\n\n    class Meta:\n        model = Course\n        fields = ['category', 'is_free']",
    "options": {
      "A": "?price_from=100&price_to=500",
      "B": "?price__between=100,500",
      "C": "?min_price=100&max_price=500&category=2",
      "D": "?search=100&ordering=500"
    },
    "correctOption": "C",
    "explanation": "min_price (price >= qiymat), max_price (price <= qiymat), category va is_free parametrlari birgalikda ishlaydi.",
    "codeExplanation": "gte — greater than or equal, lte — less than or equal."
  },
  {
    "id": "t6-q13",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi kodda 'filterset_class' ni ViewSet ga ulashda qanday xato qilingan?",
    "code": "class CourseViewSet(viewsets.ModelViewSet):\n    queryset = Course.objects.all()\n    serializer_class = CourseSerializer\n    filter_backends = [DjangoFilterBackend]\n    filterset_class = CourseFilter()",
    "options": {
      "A": "filterset_class o‘rniga filter_class yozish shart",
      "B": "DjangoFilterBackend bilan FilterSet ishlamaydi",
      "C": "CourseFilter() instansiya emas, klass (CourseFilter) berilishi kerak",
      "D": "queryset o‘rniga model ko‘rsatilishi kerak"
    },
    "correctOption": "C",
    "explanation": "filterset_class atributiga FilterSet ning instansiyasi emas, balki klassning o‘zi (CourseFilter) beriladi.",
    "codeExplanation": "CourseFilter() chaqirilsa klass import paytidayoq ishga tushib xato beradi."
  },
  {
    "id": "t6-q14",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "medium",
    "category": "terms",
    "text": "Django ORM va FilterSet da 'icontains' lookup ifodasi nimani tekshiradi?",
    "options": {
      "A": "Maydonning NULL emasligini",
      "B": "Faqat katta harflarda yozilgan aniq tenglikni",
      "C": "Raqamning berilgan oraliqda ekanligini",
      "D": "Katta-kichik harfni farqlamay qisman moslikni"
    },
    "correctOption": "D",
    "explanation": "icontains (case-insensitive contains) berilgan qism satr maydon ichida katta-kichik harfdan qat'i nazar mavjudligini tekshiradi."
  },
  {
    "id": "t6-q15",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi search_fields da 'author__username' yozuvi nimani anglatadi?",
    "code": "class ArticleViewSet(viewsets.ModelViewSet):\n    queryset = Article.objects.all()\n    filter_backends = [SearchFilter]\n    search_fields = ['title', 'author__username']",
    "options": {
      "A": "Article modelida author__username nomli matn ustuni bor",
      "B": "author va username maydonlarini birlashtirib o‘chiradi",
      "C": "Bog‘langan ForeignKey (author) modelining username maydonidan qidiradi",
      "D": "Faqat tizimga kirgan foydalanuvchi nomini qidiradi"
    },
    "correctOption": "C",
    "explanation": "Ikki pastki chiziq (__) Django ORM da bog‘langan model (ForeignKey/ManyToMany) maydonlariga o‘tib qidirish imkonini beradi.",
    "codeExplanation": "Bu SQL da author jadvali bilan JOIN qilib username bo‘yicha qidiruv bajaradi."
  },
  {
    "id": "t6-q16",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi OrderingFilter sozlamasida foydalanuvchi ?ordering=secret_code yuborsa nima sodir bo‘ladi?",
    "code": "filter_backends = [OrderingFilter]\nordering_fields = ['title', 'price']",
    "options": {
      "A": "secret_code e'tiborsiz qolib standart tartib qaytadi",
      "B": "DRF avtomatik 403 Forbidden xatosini qaytaradi",
      "C": "secret_code maydoni bo‘yicha baribir saralanib qaytadi",
      "D": "Server 500 Internal Server Error xatosini qaytaradi"
    },
    "correctOption": "A",
    "explanation": "OrderingFilter ordering_fields ro‘yxatida bo‘lmagan maydonlarni xavfsiz tarzda e'tiborsiz qoldiradi.",
    "codeExplanation": "Agar ordering_fields = '__all__' qilinsa, parol xeshi kabi maxfiy maydonlar bo‘yicha saralash xavfi tug‘iladi."
  },
  {
    "id": "t6-q17",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi oddiy APIView da filter_backends nega avtomatik ishlamaydi?",
    "code": "class CourseListAPIView(APIView):\n    filter_backends = [SearchFilter]\n    search_fields = ['title']\n\n    def get(self, request):\n        qs = Course.objects.all()\n        return Response(CourseSerializer(qs, many=True).data)",
    "options": {
      "A": "SearchFilter faqat POST so‘rovida ishlaydi",
      "B": "CourseSerializer da filter=True berilmagan",
      "C": "Oddiy APIView filter_backends ni avtomatik qo‘llamaydi",
      "D": "APIView da QuerySet ishlatib bo‘lmaydi"
    },
    "correctOption": "C",
    "explanation": "filter_backends mexanizmi GenericAPIView (va uning vorislari: ListAPIView, ModelViewSet) tomonidan filter_queryset() orqali avtomatik chaqiriladi.",
    "codeExplanation": "Oddiy APIView da qo‘lda request.query_params ni o‘qish yoki backend.filter_queryset() ni chaqirish kerak."
  },
  {
    "id": "t6-q18",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "Ko‘p maydonli murakkab saralashda avval kategoriya (o‘sish), keyin narx (kamayish) bo‘yicha tartiblash qaysi URL bilan beriladi?",
    "options": {
      "A": "/api/courses/?ordering=category&-price",
      "B": "/api/courses/?ordering=category+-price",
      "C": "/api/courses/?ordering=[category,-price]",
      "D": "/api/courses/?ordering=category,-price"
    },
    "correctOption": "D",
    "explanation": "OrderingFilter da bir nechta ustun bo‘yicha tartiblash vergul bilan ajratib beriladi: ?ordering=category,-price."
  },
  {
    "id": "t6-q19",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "API da qidiruv parametri nomini '?search=' o‘rniga '?q=' qilish uchun settings.py dagi REST_FRAMEWORK ga qaysi kalit qo‘shiladi?",
    "options": {
      "A": "'SEARCH_PARAM': 'q'",
      "B": "'QUERY_KEY': 'q'",
      "C": "'FILTER_NAME': 'q'",
      "D": "'FIND_PARAM': 'q'"
    },
    "correctOption": "A",
    "explanation": "REST_FRAMEWORK['SEARCH_PARAM'] = 'q' barcha SearchFilter endpointlarida standart ?search= nomini ?q= ga o‘zgartiradi."
  },
  {
    "id": "t6-q20",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "medium",
    "category": "theory",
    "text": "DRF da request.query_params nimani ifodalaydi?",
    "options": {
      "A": "So‘rovning JSON tanasidagi maydonlarni",
      "B": "HTTP sarlavhalaridagi token qiymatlarini",
      "C": "Yuklangan fayllar ro‘yxatini",
      "D": "URL dan keyingi GET query parametrlarini"
    },
    "correctOption": "D",
    "explanation": "request.query_params Django ning request.GET obyekti uchun DRF ning tushunarliroq sinonimi bo‘lib, URL query parametrlarini saqlaydi."
  },
  {
    "id": "t6-q21",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Quyidagi FilterSet da 'method' parametri bilan yozilgan filtr qanday ishlaydi?",
    "code": "class CourseFilter(django_filters.FilterSet):\n    has_discount = django_filters.BooleanFilter(method='filter_discount')\n\n    def filter_discount(self, queryset, name, value):\n        if value:\n            return queryset.filter(discount__gt=0)\n        return queryset.filter(discount=0)",
    "options": {
      "A": "?has_discount=true da barcha kurslarni o‘chiradi",
      "B": "Modelda has_discount ustuni bo‘lishini majburiy talab qiladi",
      "C": "?has_discount=true da chegirmasi bor kurslarni qaytaradi",
      "D": "Faqat OrderingFilter bilan birga ishlaydi"
    },
    "correctOption": "C",
    "explanation": "method='filter_discount' modelda mavjud bo‘lmagan mantiqiy parametr bo‘yicha maxsus QuerySet filtrlash imkonini beradi.",
    "codeExplanation": "BooleanFilter 'true'/'false' matnlarini Python bool qiymatiga o‘girib filter_discount ga uzatadi."
  },
  {
    "id": "t6-q22",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Quyidagi get_queryset() qo‘lda yozilganda ?status=active berilmasa nima qaytadi?",
    "code": "def get_queryset(self):\n    qs = Order.objects.all()\n    status = self.request.query_params.get('status')\n    if status:\n        qs = qs.filter(status=status)\n    return qs",
    "options": {
      "A": "Barcha Order obyektlari qaytadi",
      "B": "400 Bad Request qaytadi",
      "C": "KeyError xatosi chiqadi",
      "D": "Bo‘sh QuerySet qaytadi"
    },
    "correctOption": "A",
    "explanation": "query_params.get('status') parametr berilmaganda None qaytaradi, if status sharti bajarilmaydi va barcha obyektlar qaytadi.",
    "codeExplanation": ".get() metodi KeyError ning oldini oladi."
  },
  {
    "id": "t6-q23",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "hard",
    "category": "bug_finding",
    "text": "ManyToMany bog‘lanish (masalan, tags) bo‘yicha filtrlashda bir xil obyekt natijada ikki marta chiqib qolsa, qaysi ORM metodi muammoni hal qiladi?",
    "code": "# /api/courses/?tags=1&tags=2 da takroriy kurslar chiqmoqda\nqs = Course.objects.filter(tags__id__in=[1, 2])",
    "options": {
      "A": "qs.iterator()",
      "B": "qs.distinct()",
      "C": "qs.reverse()",
      "D": "qs.none()"
    },
    "correctOption": "B",
    "explanation": "ManyToMany JOIN natijasida bitta kurs bir nechta tegga mos kelib takrorlanishi mumkin; .distinct() takroriy yozuvlarni olib tashlaydi.",
    "codeExplanation": "django-filter da ham distinct=True parametri mavjud."
  },
  {
    "id": "t6-q24",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "Global sozlamada DEFAULT_FILTER_BACKENDS o‘rnatilgan bo‘lsa-da, bitta view da barcha filtrlashni o‘chirish uchun nima yoziladi?",
    "options": {
      "A": "filterset_fields = None",
      "B": "filter_backends = []",
      "C": "search_fields = False",
      "D": "ordering = None"
    },
    "correctOption": "B",
    "explanation": "View da filter_backends = [] deb berish global DEFAULT_FILTER_BACKENDS ro‘yxatini o‘sha view uchun to‘liq bekor qiladi."
  },
  {
    "id": "t6-q25",
    "topicId": "topic-6",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "Katta jadvalda (1 million qator) SearchFilter bilan '%keyword%' (icontains) qidiruvi sekinlashib qolsa, PostgreSQL da qaysi yondashuv eng samarali?",
    "options": {
      "A": "Pagination ni butunlay olib tashlash",
      "B": "Barcha qatorlarni Python ro‘yxatiga yuklab tekshirish",
      "C": "OrderingFilter ni o‘chirib qo‘yish",
      "D": "Full-Text Search (SearchVector/GIN indeks) ishlatish"
    },
    "correctOption": "D",
    "explanation": "Oddiy LIKE '%text%' B-tree indeksdan foydalana olmaydi; PostgreSQL Full-Text Search (django.contrib.postgres.search) va GIN/Trigram indekslar qidiruvni keskin tezlashtiradi."
  },
  {
    "id": "t6-q26",
    "topicId": "topic-6",
    "type": "open",
    "difficulty": "easy",
    "category": "terms",
    "text": "django-filter kutubxonasini Django ning INSTALLED_APPS ro‘yxatiga qo‘shishda yoziladigan aniq modul nomini yozing.",
    "acceptedAnswers": [
      "django_filters",
      "'django_filters'",
      "\"django_filters\""
    ],
    "requiresMentorReview": false,
    "explanation": "Paket pip install django-filter deb o‘rnatiladi, ammo INSTALLED_APPS ga 'django_filters' (pastki chiziq va s bilan) yoziladi."
  },
  {
    "id": "t6-q27",
    "topicId": "topic-6",
    "type": "open",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi ViewSet da narx bo‘yicha kamayish tartibida saralash uchun URL ga qo‘shiladigan query qismini yozing (? bilan boshlang).",
    "code": "class CourseViewSet(viewsets.ModelViewSet):\n    filter_backends = [OrderingFilter]\n    ordering_fields = ['price']",
    "acceptedAnswers": [
      "?ordering=-price"
    ],
    "requiresMentorReview": false,
    "explanation": "OrderingFilter da kamayish tartibi minus belgisi bilan ?ordering=-price ko‘rinishida beriladi.",
    "codeExplanation": "Musbat ?ordering=price o‘sish tartibini bildiradi."
  },
  {
    "id": "t6-q28",
    "topicId": "topic-6",
    "type": "open",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi kodda global filter backendlarini sozlash uchun REST_FRAMEWORK lug‘atidagi kalit nomini yozing.",
    "code": "REST_FRAMEWORK = {\n    '________': [\n        'django_filters.rest_framework.DjangoFilterBackend',\n    ]\n}",
    "acceptedAnswers": [
      "DEFAULT_FILTER_BACKENDS"
    ],
    "requiresMentorReview": false,
    "explanation": "Global filtrlash backendlari REST_FRAMEWORK['DEFAULT_FILTER_BACKENDS'] kalitida ro‘yxat sifatida beriladi.",
    "codeExplanation": "Bu sozlama barcha GenericAPIView va ViewSet larga tatbiq etiladi."
  },
  {
    "id": "t6-q29",
    "topicId": "topic-6",
    "type": "open",
    "difficulty": "medium",
    "category": "theory",
    "text": "DjangoFilterBackend va SearchFilter o‘rtasidagi asosiy foydalanish farqini qisqacha izohlang.",
    "acceptedAnswers": [
      "djangofilterbackend aniq maydon qiymati boyicha searchfilter bir nechta matn maydonidan qidiradi"
    ],
    "requiresMentorReview": true,
    "explanation": "DjangoFilterBackend aniq maydon va shartlar (?category=1&min_price=50) bo‘yicha filtrlaydi; SearchFilter esa bitta ?search= so‘zi orqali bir nechta matn maydonlaridan qidiradi."
  },
  {
    "id": "t6-q30",
    "topicId": "topic-6",
    "type": "open",
    "difficulty": "hard",
    "category": "practical",
    "text": "ViewSet da maxsus FilterSet klassini bog‘lash uchun ishlatiladigan atribut nomini yozing.",
    "acceptedAnswers": [
      "filterset_class"
    ],
    "requiresMentorReview": false,
    "explanation": "filterset_class = CourseFilter ko‘rinishida maxsus FilterSet klassi ViewSet ga ulanadi."
  },
  {
    "id": "t7-q1",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "API da Pagination (sahifalash) mexanizmi asosan nima uchun qo‘llaniladi?",
    "options": {
      "A": "URL manzillarni qisqartirish uchun",
      "B": "Foydalanuvchi parollarini shifrlab saqlash uchun",
      "C": "SQL jadvallarni avtomatik o‘chirish uchun",
      "D": "Katta ro‘yxatlarni kichik qismlarga bo‘lib qaytarish uchun"
    },
    "correctOption": "D",
    "explanation": "Pagination minglab yozuvlarni birdaniga qaytarish o‘rniga ularni sahifalarga bo‘lib yuboradi, bu tarmoq va server yuklamasini kamaytiradi."
  },
  {
    "id": "t7-q2",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "DRF da Throttling mexanizmi qaysi muammoni hal qiladi?",
    "options": {
      "A": "Ma'lumotlar bazasida jadval yaratishni",
      "B": "Mijozning so‘rovlar sonini vaqt bo‘yicha cheklashni",
      "C": "Media fayllarni bulutga yuklashni",
      "D": "JSON javobni HTML ga aylantirishni"
    },
    "correctOption": "B",
    "explanation": "Throttling (rate limiting) ma'lum vaqt oralig‘ida bitta foydalanuvchi yoki IP dan keladigan so‘rovlar sonini cheklab, serverni ortiqcha yuklamadan himoyalaydi."
  },
  {
    "id": "t7-q3",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "Foydalanuvchi '?page=3' ko‘rinishida sahifa raqamini ko‘rsatib murojaat qiladigan DRF pagination klassi qaysi?",
    "options": {
      "A": "LimitOffsetPagination",
      "B": "CursorPagination",
      "C": "TokenPagination",
      "D": "PageNumberPagination"
    },
    "correctOption": "D",
    "explanation": "PageNumberPagination eng keng tarqalgan usul bo‘lib, ?page=1, ?page=2 ko‘rinishidagi sahifa raqamlari bilan ishlaydi."
  },
  {
    "id": "t7-q4",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "Throttling limiti oshib ketganda DRF mijozga qaysi HTTP status kodini qaytaradi?",
    "options": {
      "A": "401 Unauthorized",
      "B": "429 Too Many Requests",
      "C": "403 Forbidden",
      "D": "408 Request Timeout"
    },
    "correctOption": "B",
    "explanation": "Belgilangan so‘rovlar cheklovidan oshib ketilganda DRF 429 Too Many Requests status kodi va Retry-After sarlavhasini qaytaradi."
  },
  {
    "id": "t7-q5",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "AnonRateThrottle faqat qaysi turdagi foydalanuvchilar uchun cheklov o‘rnatadi?",
    "options": {
      "A": "Faqat autentifikatsiya qilinmagan (anonim) mijozlarga",
      "B": "Faqat JWT tokeniga ega mijozlarga",
      "C": "Faqat POST so‘rovi yuboruvchilarga",
      "D": "Faqat tizimga kirgan admin foydalanuvchilarga"
    },
    "correctOption": "A",
    "explanation": "AnonRateThrottle autentifikatsiyadan o‘tmagan mijozlarni IP manzili asosida cheklaydi."
  },
  {
    "id": "t7-q6",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "'?limit=20&offset=40' parametrlari qaysi pagination klassiga tegishli?",
    "options": {
      "A": "CursorPagination",
      "B": "SlicePagination",
      "C": "LimitOffsetPagination",
      "D": "PageNumberPagination"
    },
    "correctOption": "C",
    "explanation": "LimitOffsetPagination nechta element olish (limit) va nechtasini o‘tkazib yuborishni (offset) belgilash imkonini beradi."
  },
  {
    "id": "t7-q7",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "UserRateThrottle autentifikatsiya qilingan foydalanuvchini nima bo‘yicha ajratib hisoblaydi?",
    "options": {
      "A": "Foydalanuvchi ID si (user.pk) bo‘yicha",
      "B": "Foydalanuvchining brauzer nomi bo‘yicha",
      "C": "Foydalanuvchining parol uzunligi bo‘yicha",
      "D": "Oxirgi so‘rovning JSON hajmi bo‘yicha"
    },
    "correctOption": "A",
    "explanation": "UserRateThrottle kirgan foydalanuvchilar uchun user.pk ni, anonim mijozlar uchun esa IP manzilini kalit sifatida ishlatadi."
  },
  {
    "id": "t7-q8",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "easy",
    "category": "practical",
    "text": "Ijtimoiy tarmoq lentasi (infinite scroll) uchun yangi postlar qo‘shilganda ham takrorlanish bo‘lmasligi uchun qaysi pagination eng mos?",
    "options": {
      "A": "PageNumberPagination",
      "B": "CursorPagination",
      "C": "LimitOffsetPagination",
      "D": "StaticPagination"
    },
    "correctOption": "B",
    "explanation": "CursorPagination kursor ko‘rsatkichi bo‘yicha ishlagani uchun yangi yozuvlar qo‘shilganda sahifalar siljib ketmaydi va katta jadvallarda tez ishlaydi."
  },
  {
    "id": "t7-q9",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi Custom Pagination klassida mijoz '?page_size=500' yuborsa, server nechta obyekt qaytaradi?",
    "code": "class StandardPagination(PageNumberPagination):\n    page_size = 10\n    page_size_query_param = 'page_size'\n    max_page_size = 100",
    "options": {
      "A": "10 ta obyekt",
      "B": "500 ta obyekt",
      "C": "100 ta obyekt",
      "D": "400 Bad Request xatosi"
    },
    "correctOption": "C",
    "explanation": "max_page_size = 100 mijoz so‘ragan miqdorni maksimal 100 ta bilan chegaralaydi, shuning uchun 500 o‘rniga 100 ta qaytadi.",
    "codeExplanation": "Agar ?page_size berilmasa standart 10 ta, 50 berilsa 50 ta, 100 dan oshsa 100 ta qaytadi."
  },
  {
    "id": "t7-q10",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi REST_FRAMEWORK sozlamasida tizimga kirgan foydalanuvchi 1 kunda nechta so‘rov yubora oladi?",
    "code": "REST_FRAMEWORK = {\n    'DEFAULT_THROTTLE_CLASSES': [\n        'rest_framework.throttling.AnonRateThrottle',\n        'rest_framework.throttling.UserRateThrottle',\n    ],\n    'DEFAULT_THROTTLE_RATES': {\n        'anon': '100/day',\n        'user': '1000/day',\n    }\n}",
    "options": {
      "A": "1100 ta so‘rov",
      "B": "Cheksiz so‘rov",
      "C": "100 ta so‘rov",
      "D": "1000 ta so‘rov"
    },
    "correctOption": "D",
    "explanation": "Autentifikatsiya qilingan foydalanuvchi uchun 'user': '1000/day' limiti amal qiladi, anonim foydalanuvchilar uchun esa 'anon': '100/day'.",
    "codeExplanation": "DRF 'second', 'minute', 'hour', 'day' (yoki 's', 'm', 'h', 'd') vaqt birliklarini qo‘llab-quvvatlaydi."
  },
  {
    "id": "t7-q11",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi settings.py da global PageNumberPagination yoqilgan, lekin sahifalash ishlamayapti. Nima yetishmayapti?",
    "code": "REST_FRAMEWORK = {\n    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination'\n}",
    "options": {
      "A": "INSTALLED_APPS ga 'pagination' qo‘shilmagan",
      "B": "PageNumberPagination global ishlamaydi",
      "C": "'PAGE_SIZE' parametri ko‘rsatilmagan",
      "D": "DEFAULT_PAGINATION_CLASS ro‘yxat bo‘lishi kerak"
    },
    "correctOption": "C",
    "explanation": "Global pagination yoqilganda albatta 'PAGE_SIZE': 20 kabi raqamli qiymat berilishi shart, aks holda sahifalash o‘chiq qoladi.",
    "codeExplanation": "PAGE_SIZE None bo‘lganda PageNumberPagination ro‘yxatni bo‘lmaydi."
  },
  {
    "id": "t7-q12",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi ScopedRateThrottle sozlamasi qaysi endpointga qanday cheklov qo‘yadi?",
    "code": "# settings.py\n'DEFAULT_THROTTLE_RATES': {'login': '5/min', 'uploads': '20/hour'}\n\n# views.py\nclass LoginView(APIView):\n    throttle_classes = [ScopedRateThrottle]\n    throttle_scope = 'login'",
    "options": {
      "A": "LoginView ga soatiga 20 ta so‘rov cheklovi",
      "B": "Barcha view larga daqiqasiga 5 ta cheklov",
      "C": "LoginView da throttlingni butunlay o‘chirish",
      "D": "LoginView ga daqiqasiga 5 ta so‘rov cheklovi"
    },
    "correctOption": "D",
    "explanation": "ScopedRateThrottle view dagi throttle_scope = 'login' nomini DEFAULT_THROTTLE_RATES dagi 'login': '5/min' qiymatiga bog‘laydi.",
    "codeExplanation": "Bu brute-force login hujumlaridan himoyalanish uchun juda qulay."
  },
  {
    "id": "t7-q13",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi CursorPagination klassida modelda 'created' maydoni bo‘lmasa nima sodir bo‘ladi?",
    "code": "class MyCursorPagination(CursorPagination):\n    page_size = 20",
    "options": {
      "A": "FieldError chiqadi, chunki standart ordering = '-created'",
      "B": "CursorPagination faqat 1-sahifani ko‘rsatadi",
      "C": "DRF avtomatik 'id' maydoniga o‘tib ketadi",
      "D": "Natijalar tasodifiy tartibda qaytadi"
    },
    "correctOption": "A",
    "explanation": "CursorPagination sukut bo‘yicha ordering = '-created' dan foydalanadi; modelda created ustuni bo‘lmasa, ordering = '-created_at' yoki '-id' qilib override qilish shart.",
    "codeExplanation": "CursorPagination uchun barqaror va noyob tartiblash maydoni talab etiladi."
  },
  {
    "id": "t7-q14",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "medium",
    "category": "terms",
    "text": "DRF throttling mexanizmi so‘rovlar tarixini qayerda saqlaydi?",
    "options": {
      "A": "PostgreSQL ning auth_user jadvalida",
      "B": "Foydalanuvchining brauzer localStorage xotirasida",
      "C": "Statik JSON fayllar papkasida",
      "D": "Django Cache tizimida (masalan, Redis yoki LocMemCache)"
    },
    "correctOption": "D",
    "explanation": "DRF throttling hisoblagichlarni Django ning CACHES tizimida (production da odatda Redis) saqlaydi."
  },
  {
    "id": "t7-q15",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "PageNumberPagination yoqilgan endpointdan qaytadigan standart JSON javobda qaysi kalitlar bo‘ladi?",
    "code": "GET /api/courses/?page=2",
    "options": {
      "A": "total, items, page, limit",
      "B": "data, meta, links, errors",
      "C": "count, next, previous, results",
      "D": "status, size, offset, rows"
    },
    "correctOption": "C",
    "explanation": "DRF ning standart PageNumberPagination javobi count (umumiy son), next (keyingi sahifa URL), previous (oldingi sahifa URL) va results (obyektlar) kalitlaridan iborat.",
    "codeExplanation": "Custom pagination da get_paginated_response() ni override qilib bu strukturani o‘zgartirish mumkin."
  },
  {
    "id": "t7-q16",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi ViewSet da global pagination ni aynan shu endpoint uchun o‘chirish qanday amalga oshirilgan?",
    "code": "class CategoryViewSet(viewsets.ReadOnlyModelViewSet):\n    queryset = Category.objects.all()\n    serializer_class = CategorySerializer\n    pagination_class = None",
    "options": {
      "A": "pagination_class = None 500 xato chiqaradi",
      "B": "Sahifalash baribir global PAGE_SIZE bilan ishlaydi",
      "C": "Faqat 1 ta kategoriya qaytadigan bo‘lib qoladi",
      "D": "pagination_class = None sahifalashni to‘liq o‘chiradi"
    },
    "correctOption": "D",
    "explanation": "View yoki ViewSet da pagination_class = None berilganda global sahifalash bekor qilinadi va barcha obyektlar ro‘yxat sifatida qaytadi.",
    "codeExplanation": "Kichik ma'lumotnomalar (masalan, kategoriyalar yoki davlatlar ro‘yxati) uchun qulay."
  },
  {
    "id": "t7-q17",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi custom throttle klassida qanday xato mavjud?",
    "code": "class BurstRateThrottle(UserRateThrottle):\n    rate = '10/min'",
    "options": {
      "A": "To‘g‘ri ishlashi uchun BaseThrottle ga allow_request yozish shart",
      "B": "scope atributi o‘zgartirilmagan, rate to‘g‘ri ishlaydi, xato yo‘q",
      "C": "scope='burst' berilmasa DEFAULT_THROTTLE_RATES['user'] ustun keladi",
      "D": "UserRateThrottle dan meros olishda rate='10/min' ruxsat etilmaydi"
    },
    "correctOption": "C",
    "explanation": "UserRateThrottle da scope = 'user' belgilangan; get_rate() avval settings dagi DEFAULT_THROTTLE_RATES[self.scope] ni tekshiradi, shuning uchun yangi scope belgilash kerak.",
    "codeExplanation": "scope = 'burst' berilsa, u 'user' bilan to‘qnashmaydi va alohida kesh kalitida saqlanadi."
  },
  {
    "id": "t7-q18",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "PageNumberPagination va LimitOffsetPagination dan farqli ravishda CursorPagination javobida qaysi maydon mavjud BO‘LMAYDI?",
    "options": {
      "A": "results",
      "B": "next",
      "C": "count",
      "D": "previous"
    },
    "correctOption": "C",
    "explanation": "CursorPagination katta jadvallarda og‘ir SELECT COUNT(*) so‘rovini bajarmaslik uchun count maydonini qaytarmaydi."
  },
  {
    "id": "t7-q19",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "Bir nechta Gunicorn worker jarayonlari ishlayotgan production serverda throttling to‘g‘ri ishlashi uchun qaysi kesh backend tanlanishi kerak?",
    "options": {
      "A": "DummyCache (keshsiz)",
      "B": "Redis yoki Memcached (umumiy markaziy kesh)",
      "C": "Oddiy Python dict o‘zgaruvchisi",
      "D": "LocMemCache (har worker o‘z xotirasida)"
    },
    "correctOption": "B",
    "explanation": "LocMemCache har bir worker jarayoni uchun alohida bo‘lgani bois umumiy limitni ushlab turolmaydi; barcha workerlar umumiy Redis keshidan foydalanishi kerak."
  },
  {
    "id": "t7-q20",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "medium",
    "category": "theory",
    "text": "Custom pagination da javob formatini (masalan, total_pages va current_page qo‘shish) o‘zgartirish uchun qaysi metod override qilinadi?",
    "options": {
      "A": "get_paginated_response()",
      "B": "get_page_size()",
      "C": "get_next_link()",
      "D": "paginate_queryset()"
    },
    "correctOption": "A",
    "explanation": "get_paginated_response(self, data) metodini qayta yozish orqali JSON javob strukturasiga istalgan qo‘shimcha maydonlar (total_pages, current_page) qo‘shiladi."
  },
  {
    "id": "t7-q21",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Quyidagi custom throttle klassi barcha so‘rovlarning taxminan necha foiziga ruxsat beradi?",
    "code": "import random\nfrom rest_framework import throttling\n\nclass RandomThrottle(throttling.BaseThrottle):\n    def allow_request(self, request, view):\n        return random.randint(1, 10) != 1",
    "options": {
      "A": "90% so‘rovlarga",
      "B": "100% so‘rovlarga",
      "C": "10% so‘rovlarga",
      "D": "50% so‘rovlarga"
    },
    "correctOption": "A",
    "explanation": "random.randint(1, 10) 1 dan 10 gacha son beradi; faqat 1 chiqqanda (10%) False, qolgan 9 holatda (90%) True qaytaradi.",
    "codeExplanation": "BaseThrottle voris klassida allow_request(self, request, view) True qaytarsa ruxsat beriladi, False da 429 qaytadi."
  },
  {
    "id": "t7-q22",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Quyidagi get_paginated_response() javobida jami 25 ta yozuv va page_size=10 bo‘lsa, 'total_pages' qiymati nechaga teng bo‘ladi?",
    "code": "def get_paginated_response(self, data):\n    return Response({\n        'count': self.page.paginator.count,\n        'total_pages': self.page.paginator.num_pages,\n        'results': data,\n    })",
    "options": {
      "A": "10",
      "B": "2",
      "C": "25",
      "D": "3"
    },
    "correctOption": "D",
    "explanation": "25 ta yozuv 10 tadan bo‘linganda 1-sahifada 10, 2-sahifada 10, 3-sahifada 5 ta bo‘ladi; demak num_pages = 3.",
    "codeExplanation": "self.page.paginator.num_pages jami sahifalar sonini yaxlitlab (ceil) qaytaradi."
  },
  {
    "id": "t7-q23",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "hard",
    "category": "bug_finding",
    "text": "Quyidagi QuerySet da pagination qo‘llanganda Django 'UnorderedObjectListWarning' ogohlantirishini bermoqda. Sababi nima?",
    "code": "class StudentListView(ListAPIView):\n    queryset = Student.objects.all()\n    serializer_class = StudentSerializer\n    pagination_class = PageNumberPagination",
    "options": {
      "A": "Student.objects.all() bo‘sh ro‘yxat qaytarmoqda",
      "B": "QuerySet yoki model Meta da aniq ordering berilmagan",
      "C": "serializer_class da id maydoni ko‘rsatilmagan",
      "D": "PageNumberPagination ListAPIView bilan ishlamaydi"
    },
    "correctOption": "B",
    "explanation": "Tartiblanmagan QuerySet sahifalanganda sahifalar o‘rtasida yozuvlar takrorlanishi yoki tushib qolishi mumkin; .order_by('id') yoki Meta.ordering shart.",
    "codeExplanation": "SQL bazasi ORDER BY bo‘lmasa qatorlar tartibini kafolatlamaydi."
  },
  {
    "id": "t7-q24",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "Nginx reverse proxy ortida turgan DRF serverda AnonRateThrottle hamma foydalanuvchilarni bitta IP (127.0.0.1) deb hisoblab bloklayapti. Yechim nima?",
    "options": {
      "A": "Nginx da X-Forwarded-For uzatish va NUM_PROXIES sozlash",
      "B": "AnonRateThrottle ni o‘chirib AllowAny qo‘yish",
      "C": "PAGE_SIZE qiymatini 1000 ga ko‘tarish",
      "D": "DEBUG = True qilib qayta ishga tushirish"
    },
    "correctOption": "A",
    "explanation": "Reverse proxy ortida mijozning haqiqiy IP sini aniqlash uchun Nginx X-Forwarded-For sarlavhasini yuborishi va DRF da NUM_PROXIES sozlanishi kerak."
  },
  {
    "id": "t7-q25",
    "topicId": "topic-7",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "10 million qatorli jadvalda ?offset=9000000&limit=20 so‘rovi nega sekin ishlaydi va uni nima bilan almashtirish ma'qul?",
    "options": {
      "A": "Throttling uni sekinlashtiradi; throttlingni o‘chirish afzal",
      "B": "OFFSET barcha oldingi qatorlarni skanerlaydi; CursorPagination afzal",
      "C": "LIMIT 20 juda kichik; PAGE_SIZE=50000 qilish afzal",
      "D": "PostgreSQL offset ni qo‘llamaydi; SQLite ga o‘tish afzal"
    },
    "correctOption": "B",
    "explanation": "SQL da katta OFFSET qiymati millionlab qatorlarni o‘qib tashlab yuborishga majbur qiladi; CursorPagination indeks bo‘yicha darhol kerakli joydan o‘qiydi."
  },
  {
    "id": "t7-q26",
    "topicId": "topic-7",
    "type": "open",
    "difficulty": "easy",
    "category": "terms",
    "text": "So‘rovlar limiti (Throttling) oshib ketganda qaytariladigan HTTP status kod raqamini yozing.",
    "acceptedAnswers": [
      "429"
    ],
    "requiresMentorReview": false,
    "explanation": "429 Too Many Requests — throttling cheklovidan oshib ketilganda qaytariladigan standart HTTP status kodidir."
  },
  {
    "id": "t7-q27",
    "topicId": "topic-7",
    "type": "open",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi ViewSet da ScopedRateThrottle qaysi limit kalitini ishlatishini ko‘rsatuvchi atribut nomini yozing.",
    "code": "class SMSView(APIView):\n    throttle_classes = [ScopedRateThrottle]\n    ________ = 'sms_send'",
    "acceptedAnswers": [
      "throttle_scope"
    ],
    "requiresMentorReview": false,
    "explanation": "ScopedRateThrottle view dagi throttle_scope atributini o‘qib, DEFAULT_THROTTLE_RATES dan mos limitni oladi.",
    "codeExplanation": "throttle_scope = 'sms_send' bo‘lsa, DEFAULT_THROTTLE_RATES['sms_send'] ishlaydi."
  },
  {
    "id": "t7-q28",
    "topicId": "topic-7",
    "type": "open",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "settings.py da barcha throttle sinflari uchun so‘rov tezligi (masalan, '100/day') yoziladigan REST_FRAMEWORK lug‘at kaliti nomini yozing.",
    "code": "REST_FRAMEWORK = {\n    '________': {\n        'anon': '50/hour',\n        'user': '500/hour',\n    }\n}",
    "acceptedAnswers": [
      "DEFAULT_THROTTLE_RATES"
    ],
    "requiresMentorReview": false,
    "explanation": "DEFAULT_THROTTLE_RATES lug‘atida har bir throttle scope uchun ruxsat etilgan so‘rovlar tezligi ko‘rsatiladi.",
    "codeExplanation": "DEFAULT_THROTTLE_CLASSES esa qaysi throttle klasslari faol ekanligini belgilaydi."
  },
  {
    "id": "t7-q29",
    "topicId": "topic-7",
    "type": "open",
    "difficulty": "medium",
    "category": "theory",
    "text": "PageNumberPagination va CursorPagination o‘rtasidagi asosiy afzallik va cheklov farqini qisqacha yozing.",
    "acceptedAnswers": [
      "pagenumber istalgan sahifaga otadi cursor esa tez va takrorlanishsiz lekin faqat keyingi oldingi"
    ],
    "requiresMentorReview": true,
    "explanation": "PageNumberPagination istalgan sahifa raqamiga sakrash va jami sonni (count) ko‘rsatish imkonini beradi; CursorPagination esa katta jadvallarda tez va siljishsiz ishlaydi, lekin faqat oldinga/orqaga yuradi."
  },
  {
    "id": "t7-q30",
    "topicId": "topic-7",
    "type": "open",
    "difficulty": "hard",
    "category": "practical",
    "text": "PageNumberPagination voris klassida mijoz ?size=25 orqali sahifa hajmini boshqara olishi uchun o‘rnatiladigan atribut nomini yozing.",
    "acceptedAnswers": [
      "page_size_query_param"
    ],
    "requiresMentorReview": false,
    "explanation": "page_size_query_param = 'size' mijozga query parametr orqali sahifa hajmini so‘rashga ruxsat beradi (max_page_size bilan birga ishlatish tavsiya etiladi)."
  },
  {
    "id": "t8-q1",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "Django loyihasida Static fayllar va Media fayllar o‘rtasidagi asosiy farq nima?",
    "options": {
      "A": "Static fayllar bazada, Media fayllar faqat brauzerda saqlanadi",
      "B": "Static fayllar vaqtinchalik, Media fayllar tizim kodi hisoblanadi",
      "C": "Static fayllar dasturchi tomonidan, Media fayllar foydalanuvchi tomonidan yuklanadi",
      "D": "Static fayllar faqat video, Media fayllar faqat CSS bo‘ladi"
    },
    "correctOption": "C",
    "explanation": "Static fayllar (CSS, JS, loyiha logosi) dasturchi tayyorlagan aktivlar, Media fayllar (avatar, PDF hujjat, rasm) esa foydalanuvchilar yuklaydigan fayllardir."
  },
  {
    "id": "t8-q2",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "HTTP orqali DRF API ga fayl yuklashda Content-Type sarlavhasi qanday bo‘lishi kerak?",
    "options": {
      "A": "application/json",
      "B": "text/plain",
      "C": "application/xml",
      "D": "multipart/form-data"
    },
    "correctOption": "D",
    "explanation": "Binar fayllarni matn maydonlari bilan birga HTTP so‘rovda yuborish uchun multipart/form-data formatidan foydalaniladi."
  },
  {
    "id": "t8-q3",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "settings.py da foydalanuvchilar yuklagan media fayllar diskda saqlanadigan asosiy papka yo‘li qaysi o‘zgaruvchida beriladi?",
    "options": {
      "A": "MEDIA_ROOT",
      "B": "UPLOAD_PATH",
      "C": "MEDIA_URL",
      "D": "STATIC_URL"
    },
    "correctOption": "A",
    "explanation": "MEDIA_ROOT yuklangan fayllar server fayl tizimida saqlanadigan mutlaq katalog yo‘lini, MEDIA_URL esa ularga brauzer orqali murojaat qilinadigan URL prefiksini belgilaydi."
  },
  {
    "id": "t8-q4",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "Django modelida ImageField dan foydalanish uchun qaysi Python kutubxonasi o‘rnatilgan bo‘lishi shart?",
    "options": {
      "A": "Pandas",
      "B": "Pillow",
      "C": "Requests",
      "D": "Celery"
    },
    "correctOption": "B",
    "explanation": "ImageField yuklangan fayl haqiqatan ham rasm ekanligini va o‘lchamlarini tekshirish uchun Pillow kutubxonasiga tayanadi."
  },
  {
    "id": "t8-q5",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "Production muhitiga chiqishdan oldin barcha ilovalardagi statik fayllarni STATIC_ROOT ga yig‘uvchi buyruq qaysi?",
    "options": {
      "A": "python manage.py buildmedia",
      "B": "python manage.py dumpfiles",
      "C": "python manage.py collectstatic",
      "D": "python manage.py loadstatic"
    },
    "correctOption": "C",
    "explanation": "collectstatic barcha INSTALLED_APPS va STATICFILES_DIRS dagi statik fayllarni bitta STATIC_ROOT papkasiga jamlaydi."
  },
  {
    "id": "t8-q6",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "Django modelida FileField(upload_to='docs/') bazaning o‘zida nimani saqlaydi?",
    "options": {
      "A": "Faylning MEDIA_ROOT ga nisbatan yo‘lini (satr)",
      "B": "Faylning to‘liq binar baytlarini",
      "C": "Faylning Base64 kodlangan matnini",
      "D": "Foydalanuvchining IP manzilini"
    },
    "correctOption": "A",
    "explanation": "FileField va ImageField faylning o‘zini diskda (yoki S3 da), ma'lumotlar bazasida esa faqat uning nisbiy yo‘lini (VARCHAR) saqlaydi."
  },
  {
    "id": "t8-q7",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "DRF da multipart/form-data ko‘rinishidagi fayl yuklash so‘rovlarini tahlil qiluvchi parser klassi qaysi?",
    "options": {
      "A": "JSONParser",
      "B": "MultiPartParser",
      "C": "YAMLParser",
      "D": "XMLParser"
    },
    "correctOption": "B",
    "explanation": "MultiPartParser (odatda FormParser bilan birga) multipart/form-data so‘rovlarini o‘qib request.data va request.FILES ga ajratadi."
  },
  {
    "id": "t8-q8",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "easy",
    "category": "practical",
    "text": "Production serverda (DEBUG=False) media va statik fayllarni foydalanuvchilarga uzatish qaysi vosita zimmasida bo‘lishi kerak?",
    "options": {
      "A": "PostgreSQL SELECT buyrug‘i orqali",
      "B": "DRF ModelSerializer ichidan",
      "C": "Django runserver orqali to‘g‘ridan-to‘g‘ri",
      "D": "Nginx, WhiteNoise yoki AWS S3/CDN orqali"
    },
    "correctOption": "D",
    "explanation": "Django DEBUG=False holatida media fayllarni o‘zi uzatmaydi; production da Nginx, WhiteNoise (statik uchun) yoki S3/CloudFront ishlatiladi."
  },
  {
    "id": "t8-q9",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi urls.py kodi qaysi rejimda media fayllarni brauzerda ochish imkonini beradi?",
    "code": "from django.conf import settings\nfrom django.conf.urls.static import static\n\nurlpatterns = [path('api/', include('courses.urls'))]\nif settings.DEBUG:\n    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)",
    "options": {
      "A": "Faqat DEBUG = False (production) rejimida",
      "B": "Har qanday rejimda cheklovsiz",
      "C": "Faqat DEBUG = True (development) rejimida",
      "D": "Faqat collectstatic dan keyin"
    },
    "correctOption": "C",
    "explanation": "static() yordamchi funksiyasi faqat development (DEBUG=True) muhitida lokal media fayllarni sinab ko‘rish uchun mo‘ljallangan.",
    "codeExplanation": "DEBUG=False bo‘lganda static() bo‘sh ro‘yxat qaytaradi."
  },
  {
    "id": "t8-q10",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi modelda upload_to='avatars/%Y/%m/' qanday papka strukturasini yaratadi?",
    "code": "class Profile(models.Model):\n    avatar = models.ImageField(upload_to='avatars/%Y/%m/')",
    "options": {
      "A": "Rasmni har oyda avtomatik o‘chirib turadi",
      "B": "Faylni yuklangan yil va oy papkalariga ajratib saqlaydi",
      "C": "Fayl nomiga tasodifiy % belgisini qo‘shadi",
      "D": "Faqat 1 yildan eski rasmlarni qabul qiladi"
    },
    "correctOption": "B",
    "explanation": "strftime formatlari (%Y — yil, %m — oy) media fayllarni media/avatars/2026/11/ kabi tartibli kataloglarga ajratadi.",
    "codeExplanation": "Bu bitta papkada o‘n minglab fayl to‘planib qolishining oldini oladi."
  },
  {
    "id": "t8-q11",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi Serializer da yuklangan fayl hajmini 5 MB bilan cheklashda qanday xato bor?",
    "code": "class DocumentSerializer(serializers.ModelSerializer):\n    def validate_file(self, value):\n        if value.size > 5 * 1024 * 1024:\n            raise serializers.ValidationError('Fayl 5 MB dan katta')\n        return value",
    "options": {
      "A": "value.size baytlarda o‘lchanadi, kod to‘g‘ri — xato yo‘q",
      "B": "5 * 1024 * 1024 o‘rniga len(value) yozilishi shart",
      "C": "value.size megabaytlarda bo‘ladi, 1024 ga ko‘paytirish xato",
      "D": "FileField da validate_file ishlamaydi"
    },
    "correctOption": "A",
    "explanation": "UploadedFile.size fayl hajmini baytlarda qaytaradi; 5 * 1024 * 1024 = 5 MiB. Kod to‘g‘ri yozilgan va qiymatni qaytaradi.",
    "codeExplanation": "Validatsiyadan o‘tgan fayl obyekti oxirida return value qilinishi ham to‘g‘ri bajarilgan."
  },
  {
    "id": "t8-q12",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi view da fayl yuklash muvaffaqiyatli ishlashi uchun parser_classes qanday sozlangan?",
    "code": "from rest_framework.parsers import MultiPartParser, FormParser\n\nclass AvatarUploadView(APIView):\n    parser_classes = [MultiPartParser, FormParser]\n\n    def post(self, request):\n        serializer = AvatarSerializer(data=request.data)\n        serializer.is_valid(raise_exception=True)\n        serializer.save()\n        return Response(serializer.data, status=201)",
    "options": {
      "A": "Faqat JSON so‘rovlarini qabul qiladi",
      "B": "Multipart fayl va form maydonlarini qabul qiladi",
      "C": "Faylni request.GET dan o‘qiydi",
      "D": "Serializer da faylni saqlamasdan qaytaradi"
    },
    "correctOption": "B",
    "explanation": "MultiPartParser va FormParser multipart/form-data so‘rovlaridagi fayl va oddiy maydonlarni request.data ichida birlashtirib beradi.",
    "codeExplanation": "DRF da request.data ham matn maydonlarini, ham yuklangan fayllarni o‘z ichiga oladi."
  },
  {
    "id": "t8-q13",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi kodda Serializer da fayl URL i to‘liq (https://...) emas, balki nisbiy (/media/...) bo‘lib qaytmoqda. Sababi nima?",
    "code": "class CourseDetailView(APIView):\n    def get(self, request, pk):\n        course = get_object_or_404(Course, pk=pk)\n        serializer = CourseSerializer(course)\n        return Response(serializer.data)",
    "options": {
      "A": "MEDIA_URL settings.py da yozilmagan",
      "B": "APIView da to‘liq URL qaytarib bo‘lmaydi",
      "C": "ImageField faqat nisbiy yo‘l qaytaradi",
      "D": "Serializer ga context={'request': request} uzatilmagan"
    },
    "correctOption": "D",
    "explanation": "GenericAPIView context={'request': request} ni avtomatik beradi, lekin oddiy APIView da qo‘lda uzatilmasa FileField/ImageField to‘liq domen URL ini qura olmaydi.",
    "codeExplanation": "CourseSerializer(course, context={'request': request}) yozilsa http://.../media/... ko‘rinishida qaytadi."
  },
  {
    "id": "t8-q14",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "medium",
    "category": "terms",
    "text": "Django da fayl kengaytmasini (masalan, faqat .pdf va .docx) tekshirish uchun tayyor validator qaysi?",
    "options": {
      "A": "FileExtensionValidator",
      "B": "RegexURLValidator",
      "C": "MaxLengthValidator",
      "D": "MimeTypeParser"
    },
    "correctOption": "A",
    "explanation": "django.core.validators.FileExtensionValidator(allowed_extensions=['pdf', 'docx']) faqat ruxsat etilgan kengaytmali fayllarni qabul qiladi."
  },
  {
    "id": "t8-q15",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi kod foydalanuvchiga faylni brauzerda ochish o‘rniga yuklab olish (download) oynasini chiqarishi uchun nima qilmoqda?",
    "code": "from django.http import FileResponse\n\ndef download_cert(request, pk):\n    cert = get_object_or_404(Certificate, pk=pk)\n    return FileResponse(cert.file.open('rb'), as_attachment=True, filename='sertifikat.pdf')",
    "options": {
      "A": "as_attachment=True Content-Disposition: attachment qo‘shadi",
      "B": "FileResponse faqat rasm fayllari uchun ishlaydi",
      "C": "open('rb') faylni JSON ga aylantiradi",
      "D": "filename parametri faylni bazadan o‘chiradi"
    },
    "correctOption": "A",
    "explanation": "FileResponse(..., as_attachment=True) Content-Disposition: attachment sarlavhasini o‘rnatib, brauzerga faylni saqlashni buyuradi.",
    "codeExplanation": "FileResponse katta fayllarni xotiraga to‘liq yuklamasdan oqim (streaming) shaklida uzatadi."
  },
  {
    "id": "t8-q16",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi settings.py sozlamalarida STATIC_URL va STATIC_ROOT qanday vazifalarni bajaradi?",
    "code": "STATIC_URL = '/static/'\nSTATIC_ROOT = BASE_DIR / 'staticfiles'",
    "options": {
      "A": "STATIC_URL disk yo‘li, STATIC_ROOT esa domen nomi",
      "B": "Ikkalasi ham faqat foydalanuvchi rasmlari uchun",
      "C": "STATIC_ROOT development da CSS yoziladigan joy",
      "D": "STATIC_URL brauzer manzili, STATIC_ROOT collectstatic yig‘adigan papka"
    },
    "correctOption": "D",
    "explanation": "STATIC_URL statik fayllarga murojaat qilinadigan URL prefiksi, STATIC_ROOT esa production da collectstatic barcha fayllarni ko‘chiradigan katalogdir.",
    "codeExplanation": "Development da qo‘shimcha statik fayllar STATICFILES_DIRS da saqlanadi."
  },
  {
    "id": "t8-q17",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi settings.py konfiguratsiyasida qanday muammo bor?",
    "code": "STATIC_URL = 'static/'\nSTATIC_ROOT = BASE_DIR / 'static'\nSTATICFILES_DIRS = [BASE_DIR / 'static']",
    "options": {
      "A": "STATIC_URL doim https:// bilan boshlanishi kerak",
      "B": "STATICFILES_DIRS ichida STATIC_ROOT papkasi bo‘lishi mumkin emas",
      "C": "STATICFILES_DIRS satr bo‘lishi shart, ro‘yxat emas",
      "D": "BASE_DIR bilan / operatorini ishlatib bo‘lmaydi"
    },
    "correctOption": "B",
    "explanation": "STATIC_ROOT va STATICFILES_DIRS bir xil katalogga ishora qilsa, Django staticfiles.E002 xatosini beradi.",
    "codeExplanation": "STATIC_ROOT alohida papka (masalan, BASE_DIR / 'staticfiles') bo‘lishi kerak."
  },
  {
    "id": "t8-q18",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "DRF da bir nechta faylni bitta so‘rovda yuklashda view ichida yuklangan fayllar ro‘yxatini olish uchun qaysi metod ishlatiladi?",
    "options": {
      "A": "request.GET.all('files')",
      "B": "request.FILES.getlist('files')",
      "C": "request.META.files('files')",
      "D": "request.COOKIES.get('files')"
    },
    "correctOption": "B",
    "explanation": "Bir xil kalit nomi bilan yuborilgan bir nechta faylni olish uchun QueryDict ning request.FILES.getlist('files') metodi ishlatiladi."
  },
  {
    "id": "t8-q19",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "Foydalanuvchilar yuklagan maxfiy shartnoma PDF larini hamma ko‘ra oladigan /media/ dan yashirib, faqat egasiga berish qanday amalga oshiriladi?",
    "options": {
      "A": "Fayl nomini katta harflarda va raqamlar bilan saqlash",
      "B": "Fayllarni STATIC_ROOT ichidagi alohida papkaga ko‘chirish",
      "C": "MEDIA_URL manzilini /secret_media/ nomiga o‘zgartirish",
      "D": "Permission tekshiruvchi view va FileResponse orqali uzatish"
    },
    "correctOption": "D",
    "explanation": "Maxfiy fayllarni himoyalangan view orqali (permission tekshirib, so‘ng FileResponse yoki Nginx X-Accel-Redirect bilan) uzatish xavfsizdir."
  },
  {
    "id": "t8-q20",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "medium",
    "category": "theory",
    "text": "Django modelidan obyekt (instance.delete()) o‘chirilganda, unga bog‘langan diskdagi media fayl bilan nima sodir bo‘ladi?",
    "options": {
      "A": "Django diskdagi faylni darhol va qaytarib bo‘lmas qilib o‘chiradi",
      "B": "Fayl avtomatik STATIC_ROOT ga ko‘chiriladi",
      "C": "Diskdagi fayl avtomatik o‘chmaydi, qo‘lda yoki signal bilan o‘chiriladi",
      "D": "Modelni o‘chirish uchun avval faylni o‘chirish majburiy"
    },
    "correctOption": "C",
    "explanation": "Tranzaksiya xavfsizligi sababli Django instance.delete() da diskdagi faylni avtomatik o‘chirmaydi (django-cleanup yoki post_delete signali ishlatiladi)."
  },
  {
    "id": "t8-q21",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Quyidagi upload_to funksiyasi fayl nomlarini qanday xavfsiz tartibda saqlaydi?",
    "code": "import uuid, os\n\ndef unique_avatar_path(instance, filename):\n    ext = os.path.splitext(filename)[1]\n    return f'avatars/{instance.user_id}/{uuid.uuid4()}{ext}'",
    "options": {
      "A": "Fayl nomini UUID ga o‘zgartirib, nom to‘qnashuvini oldini oladi",
      "B": "Fayl kengaytmasini butunlay olib tashlaydi",
      "C": "Barcha rasmlarni bitta fayl ustiga yozib ketadi",
      "D": "Faylni foydalanuvchi paroli bilan shifrlaydi"
    },
    "correctOption": "A",
    "explanation": "uuid.uuid4() har bir yuklangan faylga noyob nom beradi va asl kengaytmani (ext) saqlab qoladi, bu nom to‘qnashuvi hamda path traversal xavfini kamaytiradi.",
    "codeExplanation": "upload_to ga satr o‘rniga (instance, filename) qabul qiluvchi callable funksiya ham berish mumkin."
  },
  {
    "id": "t8-q22",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Quyidagi DRF view da FileUploadParser ishlatilganda mijoz faylni qanday yuborishi kerak?",
    "code": "from rest_framework.parsers import FileUploadParser\n\nclass RawUploadView(APIView):\n    parser_classes = [FileUploadParser]\n\n    def put(self, request, filename):\n        file_obj = request.data['file']\n        return Response(status=204)",
    "options": {
      "A": "Faqat JSON ichida Base64 satr ko‘rinishida",
      "B": "URL query parametrida ?file=bytes shaklida",
      "C": "Xom binar tana sifatida va Content-Disposition sarlavhasi bilan",
      "D": "HTML formaning multipart/form-data maydonida"
    },
    "correctOption": "C",
    "explanation": "FileUploadParser multipart o‘rniga xom (raw) fayl mazmunini so‘rov tanasida qabul qiladi va uni request.data['file'] ga joylaydi.",
    "codeExplanation": "Ko‘pincha katta fayllarni PUT orqali to‘g‘ridan-to‘g‘ri yuklashda qo‘llaniladi."
  },
  {
    "id": "t8-q23",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "hard",
    "category": "bug_finding",
    "text": "Quyidagi fayl validatsiyasida qanday xavfsizlik zaifligi mavjud?",
    "code": "def validate_file(self, value):\n    if not value.name.endswith('.png'):\n        raise serializers.ValidationError('Faqat PNG')\n    return value",
    "options": {
      "A": "endswith() metodi Python satrlarida qo‘llab-quvvatlanmaydi",
      "B": "ValidationError istisnosi FileField maydonlarida ishlamaydi",
      "C": "value.name atributi yuklangan faylda har doim bo‘sh bo‘ladi",
      "D": "Faqat nom oxiri tekshirilgan, fayl baytlari tekshirilmagan"
    },
    "correctOption": "D",
    "explanation": "Hujumchi zararli skript nomini .png qilib o‘zgartirishi mumkin; xavfsiz tekshiruv uchun ImageField (Pillow) yoki python-magic orqali fayl mazmunini tekshirish kerak.",
    "codeExplanation": "Fayl kengaytmasi mijoz tomonidan osonlikcha soxtalashtirilishi mumkin."
  },
  {
    "id": "t8-q24",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "Yuklanadigan fayl hajmini Django darajasida (masalan, 10 MB) global cheklash uchun settings.py da qaysi sozlama ishlatiladi?",
    "options": {
      "A": "MAX_FILE_UPLOAD_COUNT sozlamasi",
      "B": "POSTGRES_MAX_BLOB_SIZE sozlamasi",
      "C": "MEDIA_MAX_UPLOAD_MB sozlamasi",
      "D": "DATA_UPLOAD_MAX_MEMORY_SIZE sozlamasi"
    },
    "correctOption": "D",
    "explanation": "DATA_UPLOAD_MAX_MEMORY_SIZE so‘rov tanasi maksimal hajmini, FILE_UPLOAD_MAX_MEMORY_SIZE esa fayl RAM dan vaqtinchalik diskka o‘tish chegarasini belgilaydi (Nginx da esa client_max_body_size)."
  },
  {
    "id": "t8-q25",
    "topicId": "topic-8",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "Bir nechta server (horizontal scaling) bilan ishlaydigan DRF loyihada media fayllarni qayerda saqlash to‘g‘ri arxitektura hisoblanadi?",
    "options": {
      "A": "PostgreSQL ning TEXT ustuni ichida",
      "B": "Git repozitoriy ichidagi media papkada",
      "C": "AWS S3 yoki MinIO obyekt xotirasida",
      "D": "Har bir serverning o‘z lokal diskida"
    },
    "correctOption": "C",
    "explanation": "Ko‘p serverli muhitda lokal diskdagi fayl boshqa serverlarga ko‘rinmaydi; django-storages orqali S3/MinIO ishlatish standart yechimdir."
  },
  {
    "id": "t8-q26",
    "topicId": "topic-8",
    "type": "open",
    "difficulty": "easy",
    "category": "terms",
    "text": "Django modelida faqat rasm fayllarini saqlash va tekshirish uchun mo‘ljallangan maydon klassi nomini yozing.",
    "acceptedAnswers": [
      "ImageField",
      "models.ImageField"
    ],
    "requiresMentorReview": false,
    "explanation": "models.ImageField FileField dan meros oladi va Pillow yordamida fayl haqiqiy rasm ekanligini tekshiradi."
  },
  {
    "id": "t8-q27",
    "topicId": "topic-8",
    "type": "open",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi settings.py da media fayllarga brauzer orqali murojaat qilinadigan URL prefiksi nomini yozing.",
    "code": "________ = '/media/'\nMEDIA_ROOT = BASE_DIR / 'media'",
    "acceptedAnswers": [
      "MEDIA_URL"
    ],
    "requiresMentorReview": false,
    "explanation": "MEDIA_URL media fayllarning tashqi URL manzili prefiksini (odatda '/media/') belgilaydi.",
    "codeExplanation": "MEDIA_ROOT esa diskdagi papka manzilidir."
  },
  {
    "id": "t8-q28",
    "topicId": "topic-8",
    "type": "open",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "DRF da multipart/form-data fayl yuklashni qo‘llab-quvvatlovchi asosiy parser klassining aniq nomini yozing.",
    "code": "class UploadView(APIView):\n    parser_classes = [________, FormParser]",
    "acceptedAnswers": [
      "MultiPartParser"
    ],
    "requiresMentorReview": false,
    "explanation": "rest_framework.parsers.MultiPartParser multipart/form-data so‘rovlaridagi fayllarni tahlil qiladi.",
    "codeExplanation": "MultiPartParser katta P harfi bilan yozilishiga e'tibor bering."
  },
  {
    "id": "t8-q29",
    "topicId": "topic-8",
    "type": "open",
    "difficulty": "medium",
    "category": "theory",
    "text": "STATIC_URL va STATIC_ROOT o‘rtasidagi farqni qisqacha tushuntiring.",
    "acceptedAnswers": [
      "static_url brauzer manzili static_root collectstatic yigadigan disk papkasi"
    ],
    "requiresMentorReview": true,
    "explanation": "STATIC_URL statik fayllarga HTTP orqali murojaat qilinadigan URL prefiksi, STATIC_ROOT esa production da collectstatic barcha statik fayllarni yig‘adigan server katalogidir."
  },
  {
    "id": "t8-q30",
    "topicId": "topic-8",
    "type": "open",
    "difficulty": "hard",
    "category": "practical",
    "text": "Django da faylni oqim (streaming) shaklida yuklab olish (download) uchun qaytariladigan standart HTTP javob klassi nomini yozing.",
    "acceptedAnswers": [
      "FileResponse"
    ],
    "requiresMentorReview": false,
    "explanation": "django.http.FileResponse fayllarni xotirani to‘ldirmasdan samarali uzatadi va as_attachment=True orqali yuklab olishni ta'minlaydi."
  },
  {
    "id": "t9-q1",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "DRF loyihasida avtomatlashtirilgan API testlarini yozishning asosiy foydasi nima?",
    "options": {
      "A": "Kod o‘zgarganda xatolarni tez va ishonchli aniqlash",
      "B": "Server tezligini ikki barobar oshirish",
      "C": "PostgreSQL bazasini SQLite ga almashtirish",
      "D": "Frontend dizaynini avtomatik chizib berish"
    },
    "correctOption": "A",
    "explanation": "Avtomatlashtirilgan testlar (regressiya testi) har bir yangi o‘zgarishdan keyin endpointlar va biznes mantiq buzilmaganini kafolatlaydi."
  },
  {
    "id": "t9-q2",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "DRF da API endpointlarni testlash uchun Django TestCase asosida yaratilgan maxsus klass qaysi?",
    "options": {
      "A": "ModelTestCase",
      "B": "APITestCase",
      "C": "HttpTestCase",
      "D": "SerializerCase"
    },
    "correctOption": "B",
    "explanation": "rest_framework.test.APITestCase o‘z ichida tayyor self.client = APIClient() bilan keladi va DRF endpointlarini testlashni qulaylashtiradi."
  },
  {
    "id": "t9-q3",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "Swagger UI va ReDoc interfeyslari qaysi standart spetsifikatsiya asosida API hujjatini yaratadi?",
    "options": {
      "A": "OpenAPI (OAS)",
      "B": "SQL-99",
      "C": "HTML5 Canvas",
      "D": "GraphQL SDL"
    },
    "correctOption": "A",
    "explanation": "Swagger UI va ReDoc OpenAPI (JSON/YAML) sxemasini o‘qib, interaktiv va o‘qishga qulay API hujjatlarini ko‘rsatadi."
  },
  {
    "id": "t9-q4",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "Postman dasturi backend dasturchilar tomonidan asosan nima maqsadda ishlatiladi?",
    "options": {
      "A": "API endpointlarga HTTP so‘rov yuborib tekshirish uchun",
      "B": "Python kodini kompilyatsiya qilish uchun",
      "C": "PostgreSQL jadvallarini migratsiya qilish uchun",
      "D": "CSS animatsiyalarini tahrirlash uchun"
    },
    "correctOption": "A",
    "explanation": "Postman GET, POST, PUT, DELETE so‘rovlarini sarlavha, token va JSON tana bilan yuborib, API javoblarini qo‘lda va kolleksiya orqali tekshirish vositasidir."
  },
  {
    "id": "t9-q5",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "Django standart 'python manage.py test' buyrug‘i testlarni qaysi ma'lumotlar bazasida bajaradi?",
    "options": {
      "A": "Foydalanuvchi brauzeri keshida ishlaydi",
      "B": "Alohida vaqtinchalik test bazasini yaratib, oxirida o‘chiradi",
      "C": "To‘g‘ridan-to‘g‘ri asosiy production bazasida ishlaydi",
      "D": "Ma'lumotlar bazasisiz faqat xotirada ishlaydi"
    },
    "correctOption": "B",
    "explanation": "Django test runner asosiy bazaga tegmasdan vaqtinchalik test_<db_name> bazasini yaratadi, migratsiyalarni yuritadi va yakunda uni o‘chiradi."
  },
  {
    "id": "t9-q6",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "Pytest ni Django loyihasi bilan integratsiya qilish uchun qaysi plagin o‘rnatiladi?",
    "options": {
      "A": "pytest-rest",
      "B": "pytest-sql",
      "C": "pytest-django",
      "D": "django-unittest"
    },
    "correctOption": "C",
    "explanation": "pytest-django plagini pytest ichida Django sozlamalari, test bazasi (@pytest.mark.django_db) va fixture lardan foydalanish imkonini beradi."
  },
  {
    "id": "t9-q7",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "Swagger UI ning ReDoc dan asosiy amaliy farqi nimada?",
    "options": {
      "A": "Swagger UI da 'Try it out' orqali so‘rov yuborish qulayroq",
      "B": "ReDoc faqat Python 2 da ishlaydi",
      "C": "ReDoc faqat POST so‘rovlarini ko‘rsatadi",
      "D": "Swagger UI OpenAPI sxemasini qo‘llamaydi"
    },
    "correctOption": "A",
    "explanation": "Swagger UI interaktiv testlash ('Try it out') uchun juda qulay, ReDoc esa uch ustunli chiroyli o‘qiladigan hujjat ko‘rinishi bilan ajralib turadi."
  },
  {
    "id": "t9-q8",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "easy",
    "category": "practical",
    "text": "Zamonaviy DRF loyihalarida OpenAPI 3 sxemasi, Swagger va ReDoc hujjatlarini avtomatik yaratish uchun eng tavsiya etilgan kutubxona qaysi?",
    "options": {
      "A": "django-crispy-forms",
      "B": "django-debug-toolbar",
      "C": "whitenoise",
      "D": "drf-spectacular"
    },
    "correctOption": "D",
    "explanation": "drf-spectacular DRF uchun zamonaviy OpenAPI 3.0 spetsifikatsiyasi, Swagger UI va ReDoc generatsiyasining standart kutubxonasidir."
  },
  {
    "id": "t9-q9",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi APITestCase metodi qaysi natijani tekshirmoqda?",
    "code": "class CourseAPITest(APITestCase):\n    def test_create_course_unauthenticated(self):\n        url = reverse('course-list')\n        response = self.client.post(url, {'title': 'DRF'}, format='json')\n        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)",
    "options": {
      "A": "Yangi kurs muvaffaqiyatli yaratilganini",
      "B": "Autentifikatsiyasiz POST so‘rovi 401 qaytarishini",
      "C": "Kurs ro‘yxati bo‘sh ekanligini",
      "D": "Server 500 xato berayotganini"
    },
    "correctOption": "B",
    "explanation": "Test login qilinmagan mijoz kurs yaratishga uringanda 401 Unauthorized javobi qaytishini tasdiqlaydi.",
    "codeExplanation": "reverse('course-list') URL ni qattiq yozmasdan nomi bo‘yicha oladi."
  },
  {
    "id": "t9-q10",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi APIClient metodi testda nimani amalga oshiradi?",
    "code": "self.client.force_authenticate(user=self.mentor)",
    "options": {
      "A": "Foydalanuvchi parolini bazada yangilaydi",
      "B": "Barcha ruxsat (permission) tekshiruvlarini o‘chiradi",
      "C": "Foydalanuvchini tizimdan chiqarib yuboradi",
      "D": "Foydalanuvchini token yaratmasdan bevosita autentifikatsiya qiladi"
    },
    "correctOption": "D",
    "explanation": "force_authenticate(user=...) login/JWT bosqichini chetlab o‘tib, test so‘rovlarida request.user ni darhol ko‘rsatilgan foydalanuvchi qilib o‘rnatadi.",
    "codeExplanation": "Bu permission va biznes mantiq testlarini ancha tez va toza yozish imkonini beradi."
  },
  {
    "id": "t9-q11",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi pytest funksiyasida ma'lumotlar bazasiga murojaat qilinganda 'Database access not allowed' xatosi chiqmoqda. Nima yetishmayapti?",
    "code": "def test_course_list(api_client):\n    Course.objects.create(title='DRF')\n    res = api_client.get('/api/courses/')\n    assert res.status_code == 200",
    "options": {
      "A": "assert o‘rniga self.assertEqual yozilishi shart",
      "B": "pytest da Course.objects.create ishlamaydi",
      "C": "@pytest.mark.django_db dekoratori qo‘yilmagan",
      "D": "Funksiya nomi test_ bilan boshlanmasligi kerak"
    },
    "correctOption": "C",
    "explanation": "pytest-django sukut bo‘yicha testlarning bazaga tegishini bloklaydi; bazadan foydalanish uchun @pytest.mark.django_db markeri (yoki db fixture) kerak.",
    "codeExplanation": "Bu baza kerak bo‘lmagan unit testlarning juda tez ishlashini ta'minlaydi."
  },
  {
    "id": "t9-q12",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi APITestCase da setUp() metodi qachon ishga tushadi?",
    "code": "class BookTests(APITestCase):\n    def setUp(self):\n        self.user = User.objects.create_user(username='ali', password='123')\n\n    def test_one(self): ...\n    def test_two(self): ...",
    "options": {
      "A": "Har bir test metodidan (test_one, test_two) oldin alohida",
      "B": "Faqat barcha testlar tugagandan keyin bir marta",
      "C": "Faqat birinchi test metodidan oldin bir marta",
      "D": "Faqat test muvaffaqiyatsiz tugaganda"
    },
    "correctOption": "A",
    "explanation": "setUp() har bir test_* metodi bajarilishidan oldin qayta ishga tushib, testlarning bir-biridan to‘liq izolyatsiyasini ta'minlaydi.",
    "codeExplanation": "Agar ma'lumotni butun klass uchun faqat bir marta yaratish kerak bo‘lsa, setUpTestData() ishlatiladi."
  },
  {
    "id": "t9-q13",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi APITestCase ichidagi metod nega 'python manage.py test' buyrug‘ida ishga tushmayapti?",
    "code": "class CourseTests(APITestCase):\n    def check_course_creation(self):\n        res = self.client.get('/api/courses/')\n        self.assertEqual(res.status_code, 200)",
    "options": {
      "A": "Klass nomi Tests bilan tugashi mumkin emas",
      "B": "self.client.get() da format='json' berilmagan",
      "C": "Metod nomi 'test_' prefiksi bilan boshlanmagan",
      "D": "assertEqual o‘rniga assertTrue kerak"
    },
    "correctOption": "C",
    "explanation": "Django unittest va pytest test runnerlari faqat nomi 'test_' bilan boshlanadigan metodlarni avtomatik aniqlab ishga tushiradi.",
    "codeExplanation": "Metod nomini test_course_creation deb o‘zgartirish kerak."
  },
  {
    "id": "t9-q14",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "medium",
    "category": "terms",
    "text": "drf-spectacular da Swagger UI va ReDoc ga qo‘shimcha tavsif, parametr yoki javob misoli qo‘shuvchi dekorator qaysi?",
    "options": {
      "A": "@swagger_doc",
      "B": "@api_manual",
      "C": "@extend_schema",
      "D": "@openapi_view"
    },
    "correctOption": "C",
    "explanation": "drf_spectacular.utils.extend_schema dekoratori endpoint uchun summary, description, parameters va responses ni aniq hujjatlashtirish imkonini beradi."
  },
  {
    "id": "t9-q15",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi APIClient so‘rovida 'HTTP_AUTHORIZATION' qanday yuborilmoqda?",
    "code": "self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + access_token)\nresponse = self.client.get('/api/profile/')",
    "options": {
      "A": "Token qiymatini URL query parametriga biriktirib beradi",
      "B": "Faqat bitta GET so‘rovidan keyin tokenni tozalaydi",
      "C": "Foydalanuvchini Django session orqali tizimga kiritadi",
      "D": "Keyingi so‘rovlarga Authorization sarlavhasini qo‘shadi"
    },
    "correctOption": "D",
    "explanation": "client.credentials(...) keyingi barcha so‘rovlarga ko‘rsatilgan HTTP sarlavhalarini avtomatik biriktiradi (tozalash uchun credentials() bo‘sh chaqiriladi).",
    "codeExplanation": "Haqiqiy JWT autentifikatsiya zanjirini to‘liq tekshirish uchun force_authenticate o‘rniga credentials ishlatiladi."
  },
  {
    "id": "t9-q16",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi drf-spectacular URL konfiguratsiyasi qaysi uchta manzilni taqdim etadi?",
    "code": "urlpatterns = [\n    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),\n    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema')),\n    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema')),\n]",
    "options": {
      "A": "Postman eksport, SQL konsol va log sahifalarini",
      "B": "OpenAPI sxemasi, Swagger UI va ReDoc sahifalarini",
      "C": "Pytest hisoboti, coverage va linter sahifalarini",
      "D": "Admin panel, login va logout sahifalarini"
    },
    "correctOption": "B",
    "explanation": "SpectacularAPIView OpenAPI YAML/JSON sxemasini, SpectacularSwaggerView Swagger UI ni, SpectacularRedocView esa ReDoc interfeysini taqdim etadi.",
    "codeExplanation": "url_name='schema' Swagger va ReDoc ga sxemani qayerdan yuklashni ko‘rsatadi."
  },
  {
    "id": "t9-q17",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi testda ichma-ich (nested) JSON yuborilganda 400 xato chiqmoqda. Sababi nima?",
    "code": "payload = {'title': 'DRF', 'tags': ['python', 'api']}\nres = self.client.post('/api/courses/', payload)",
    "options": {
      "A": "payload lug‘atida ro‘yxat bo‘lishi mumkin emas",
      "B": "self.client.post() 2 ta argument qabul qilmaydi",
      "C": "format='json' berilmagan, standart multipart yuborilgan",
      "D": "URL oxirida slash (/) bo‘lmasligi kerak"
    },
    "correctOption": "C",
    "explanation": "APIClient sukut bo‘yicha multipart formatida yuboradi; ichma-ich JSON va ro‘yxatlar uchun format='json' (yoki TEST_REQUEST_DEFAULT_FORMAT='json') berilishi kerak.",
    "codeExplanation": "format='json' Content-Type: application/json sifatida yuboradi."
  },
  {
    "id": "t9-q18",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "API testida resurs yaratish (POST) endpointini to‘liq tekshirish uchun faqat status_code == 201 tekshirish yetarlimi?",
    "options": {
      "A": "Ha, 201 status kodi har doim to‘liq kafolat beradi",
      "B": "Ha, agar settings.py da DEBUG=True bo‘lsa yetarli",
      "C": "Yo‘q, faqat response.headers sarlavhasi tekshiriladi",
      "D": "Yo‘q, response.data va bazadagi yozuv ham tekshiriladi"
    },
    "correctOption": "D",
    "explanation": "Sifatli API testi HTTP status kodini, response.data maydonlarini hamda ma'lumotlar bazasida (Model.objects.count()) obyekt haqiqatan saqlanganini tekshiradi."
  },
  {
    "id": "t9-q19",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "Pytest da barcha testlarda qayta ishlatiladigan APIClient obyektini qaysi mexanizm orqali yaratish eng toza usul?",
    "options": {
      "A": "Global o‘zgaruvchi sifatida settings.py da",
      "B": "Har bir test ichida manage.py ni chaqirib",
      "C": "models.py ichida klass atributi qilib",
      "D": "@pytest.fixture orqali conftest.py da"
    },
    "correctOption": "D",
    "explanation": "conftest.py faylida @pytest.fixture sifatida e'lon qilingan api_client barcha test fayllarida import qilmasdan parametr sifatida ishlatiladi."
  },
  {
    "id": "t9-q20",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "medium",
    "category": "theory",
    "text": "APIRequestFactory va APIClient o‘rtasidagi asosiy farq nima?",
    "options": {
      "A": "APIRequestFactory faqat Postman kolleksiyalari bilan ishlaydi",
      "B": "APIRequestFactory view ni, APIClient to‘liq zanjirni testlaydi",
      "C": "APIClient faqat GET, APIRequestFactory faqat POST testlaydi",
      "D": "APIClient JSON formatidagi so‘rov tanasini qo‘llab-quvvatlamaydi"
    },
    "correctOption": "B",
    "explanation": "APIRequestFactory URL resolver va middleware larni chetlab o‘tib view ning o‘zini tez unit-test qiladi; APIClient esa to‘liq HTTP siklini (integratsion test) tekshiradi."
  },
  {
    "id": "t9-q21",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Quyidagi pytest parametrlashtirish kodi test funksiyasini necha marta ishga tushiradi?",
    "code": "@pytest.mark.parametrize('price,expected_status', [\n    (100, 201),\n    (0, 201),\n    (-50, 400),\n])\ndef test_course_price(api_client, price, expected_status):\n    res = api_client.post('/api/courses/', {'title': 'A', 'price': price}, format='json')\n    assert res.status_code == expected_status",
    "options": {
      "A": "3 marta",
      "B": "2 marta",
      "C": "6 marta",
      "D": "1 marta"
    },
    "correctOption": "A",
    "explanation": "@pytest.mark.parametrize ro‘yxatdagi har bir kortej (3 ta holat: 100, 0, -50) uchun testni alohida holat sifatida bajaradi.",
    "codeExplanation": "Bu takroriy kod yozmasdan chegara va xato holatlarini tekshirishning eng yaxshi usuli."
  },
  {
    "id": "t9-q22",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Quyidagi 'assertNumQueries' kontekst menejeri nimani tekshiradi?",
    "code": "with self.assertNumQueries(2):\n    response = self.client.get('/api/courses/')",
    "options": {
      "A": "Endpoint aynan 2 ta obyekt qaytarishini",
      "B": "So‘rov 2 soniyadan tez bajarilishini",
      "C": "Endpoint aynan 2 ta SQL so‘rov bajarishini",
      "D": "Endpointga 2 marta GET yuborilishini"
    },
    "correctOption": "C",
    "explanation": "assertNumQueries(n) blok ichida bazaga aynan n ta SQL so‘rov ketganini tekshirib, N+1 muammosi paydo bo‘lishini test darajasida ushlaydi.",
    "codeExplanation": "select_related/prefetch_related samaradorligini avtomatik nazorat qilishda juda foydali."
  },
  {
    "id": "t9-q23",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "hard",
    "category": "bug_finding",
    "text": "Quyidagi drf-spectacular konfiguratsiyasida Swagger sahifasi ochilganda sxema yaratilmay xato bermoqda. Sababi nima?",
    "code": "# settings.py\nINSTALLED_APPS = ['rest_framework', 'drf_spectacular']\nREST_FRAMEWORK = {\n    # DEFAULT_SCHEMA_CLASS yozilmagan\n}",
    "options": {
      "A": "Spectacular ishlashi uchun PostgreSQL bazasi majburiy",
      "B": "Swagger UI faqat DEBUG=False rejimida ochiladi",
      "C": "drf_spectacular INSTALLED_APPS da birinchi turishi shart",
      "D": "DEFAULT_SCHEMA_CLASS ga AutoSchema ko‘rsatilmagan"
    },
    "correctOption": "D",
    "explanation": "drf-spectacular ishlashi uchun REST_FRAMEWORK['DEFAULT_SCHEMA_CLASS'] = 'drf_spectacular.openapi.AutoSchema' sozlanishi shart.",
    "codeExplanation": "Aks holda DRF ning standart SchemaGenerator i ishga tushib ziddiyat beradi."
  },
  {
    "id": "t9-q24",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "Test paytida tashqi to‘lov tizimi (masalan, Click/Payme) API siga haqiqiy tarmoq so‘rovi yubormaslik uchun qaysi texnika qo‘llaniladi?",
    "options": {
      "A": "Pagination (CursorPagination) texnikasi",
      "B": "Throttling (AnonRateThrottle) texnikasi",
      "C": "Database Migration (makemigrations) texnikasi",
      "D": "Mocking (unittest.mock.patch) texnikasi"
    },
    "correctOption": "D",
    "explanation": "unittest.mock.patch yordamida tashqi HTTP chaqiruvlar soxta (mock) javob bilan almashtiriladi, natijada testlar tezkor, barqaror va internetsiz ishlaydi."
  },
  {
    "id": "t9-q25",
    "topicId": "topic-9",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "Testlarda kodning necha foizi testlar bilan qamrab olinganini o‘lchash uchun qaysi vosita ishlatiladi?",
    "options": {
      "A": "django-filter",
      "B": "coverage.py yoki pytest-cov",
      "C": "drf-spectacular",
      "D": "gunicorn"
    },
    "correctOption": "B",
    "explanation": "coverage.py va pytest-cov (pytest --cov) qaysi fayl va qatorlar testlar bilan qamrab olingani yoki qolib ketganini ko‘rsatib beradi."
  },
  {
    "id": "t9-q26",
    "topicId": "topic-9",
    "type": "open",
    "difficulty": "easy",
    "category": "terms",
    "text": "DRF da API endpointlarni testlash uchun ishlatiladigan asosiy mijoz (client) klassining nomini yozing.",
    "acceptedAnswers": [
      "APIClient"
    ],
    "requiresMentorReview": false,
    "explanation": "rest_framework.test.APIClient Django test client ini kengaytirib, format='json', credentials() va force_authenticate() imkoniyatlarini qo‘shadi."
  },
  {
    "id": "t9-q27",
    "topicId": "topic-9",
    "type": "open",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi pytest testiga ma'lumotlar bazasidan foydalanish ruxsatini beruvchi dekoratorni to‘liq yozing.",
    "code": "________\ndef test_user_count():\n    assert User.objects.count() == 0",
    "acceptedAnswers": [
      "@pytest.mark.django_db"
    ],
    "requiresMentorReview": false,
    "explanation": "@pytest.mark.django_db markeri pytest-django da test funksiyasiga test bazasiga murojaat qilish huquqini beradi.",
    "codeExplanation": "Har bir test yakunida baza tranzaksiyasi avtomatik rollback qilinadi."
  },
  {
    "id": "t9-q28",
    "topicId": "topic-9",
    "type": "open",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi APIClient POST so‘rovida nested JSON yuborish uchun yetishmayotgan parametrni 'kalit=qiymat' ko‘rinishida yozing.",
    "code": "self.client.post('/api/orders/', {'items': [1, 2]}, ________)",
    "acceptedAnswers": [
      "format='json'",
      "format=\"json\""
    ],
    "requiresMentorReview": false,
    "explanation": "format='json' parametri ma'lumotni multipart o‘rniga application/json formatida uzatadi.",
    "codeExplanation": "Ichma-ich ro‘yxat va lug‘atlar uchun format='json' muhim."
  },
  {
    "id": "t9-q29",
    "topicId": "topic-9",
    "type": "open",
    "difficulty": "medium",
    "category": "theory",
    "text": "Swagger UI va ReDoc o‘rtasidagi asosiy farqni va qaysi biri qaysi vaziyatda qulayligini qisqacha yozing.",
    "acceptedAnswers": [
      "swagger interaktiv testlash uchun qulay redoc esa oqishga qulay hujjat uchun"
    ],
    "requiresMentorReview": true,
    "explanation": "Swagger UI brauzerning o‘zidan 'Try it out' orqali so‘rov yuborib sinash uchun qulay; ReDoc esa frontend va hamkor dasturchilar uchun tartibli o‘qiladigan hujjat ko‘rinishida qulay."
  },
  {
    "id": "t9-q30",
    "topicId": "topic-9",
    "type": "open",
    "difficulty": "hard",
    "category": "practical",
    "text": "APIClient da login jarayonini bajarmasdan test foydalanuvchisini darhol autentifikatsiya qiluvchi metod nomini yozing.",
    "acceptedAnswers": [
      "force_authenticate"
    ],
    "requiresMentorReview": false,
    "explanation": "client.force_authenticate(user=user) testlarda token/parol tekshiruvisiz tezkor autentifikatsiya qiladi."
  },
  {
    "id": "fe-q1",
    "topicId": "final-exam",
    "sourceTopicId": "topic-1",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "REST API arxitekturasida 'Cacheable' (keshlanuvchan) prinsipi nimani bildiradi?",
    "options": {
      "A": "Server javoblari keshlanishi mumkin yoki mumkin emasligini aniq ko‘rsatishi kerak",
      "B": "Mijoz barcha POST so‘rovlarini brauzer keshida majburiy saqlashi kerak",
      "C": "Ma'lumotlar bazasi har 10 soniyada xotiradan o‘chirilishi kerak",
      "D": "Har bir GET so‘rovi serverda yangi sessiya yaratishi kerak"
    },
    "correctOption": "A",
    "explanation": "REST ning Cacheable prinsipiga ko‘ra, javoblarda Cache-Control kabi sarlavhalar orqali keshlanish qoidasi aniq ko‘rsatiladi."
  },
  {
    "id": "fe-q2",
    "topicId": "final-exam",
    "sourceTopicId": "topic-2",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "PostgreSQL ma'lumotlar bazasida jadval qatorlarini noyob aniqlovchi asosiy kalit qanday ataladi?",
    "options": {
      "A": "Foreign Key",
      "B": "Primary Key",
      "C": "Composite Index",
      "D": "Unique Constraint"
    },
    "correctOption": "B",
    "explanation": "Primary Key (asosiy kalit) jadvaldagi har bir yozuvni noyob identifikatsiya qiladi va NULL qiymat qabul qilmaydi."
  },
  {
    "id": "fe-q3",
    "topicId": "final-exam",
    "sourceTopicId": "topic-3",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "SimpleRouter va DefaultRouter o‘rtasidagi asosiy farq nimada?",
    "options": {
      "A": "SimpleRouter faqat GET so‘rovlarini marshrutlaydi",
      "B": "DefaultRouter qo‘shimcha ravishda API Root sahifasini ham yaratadi",
      "C": "DefaultRouter ModelViewSet bilan ishlamaydi",
      "D": "SimpleRouter faqat PostgreSQL bazasida ishlaydi"
    },
    "correctOption": "B",
    "explanation": "DefaultRouter SimpleRouter ning barcha URL lariga qo‘shimcha ravishda asosiy API Root (/) va format suffix (.json) yo‘llarini yaratadi."
  },
  {
    "id": "fe-q4",
    "topicId": "final-exam",
    "sourceTopicId": "topic-4",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "JWT autentifikatsiyasida qisqa muddatli va har bir himoyalangan so‘rovda yuboriladigan token qanday nomlanadi?",
    "options": {
      "A": "Refresh Token",
      "B": "Session Key",
      "C": "CSRF Token",
      "D": "Access Token"
    },
    "correctOption": "D",
    "explanation": "Access Token qisqa muddatli (masalan, 5–15 daqiqa) bo‘lib, har bir API so‘rovining Authorization: Bearer sarlavhasida yuboriladi."
  },
  {
    "id": "fe-q5",
    "topicId": "final-exam",
    "sourceTopicId": "topic-5",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "IsAuthenticated permission klassi qaysi foydalanuvchilarga so‘rov yuborishga ruxsat beradi?",
    "options": {
      "A": "Faqat superuser huquqiga ega adminlarga",
      "B": "Faqat GET so‘rovi yuboruvchi mijozlarga",
      "C": "Tizimga kirgan barcha foydalanuvchilarga",
      "D": "Faqat anonim (login qilmagan) mijozlarga"
    },
    "correctOption": "C",
    "explanation": "IsAuthenticated bool(request.user and request.user.is_authenticated) shartini tekshirib, faqat tizimga kirgan foydalanuvchilarga ruxsat beradi."
  },
  {
    "id": "fe-q6",
    "topicId": "final-exam",
    "sourceTopicId": "topic-6",
    "type": "mcq",
    "difficulty": "easy",
    "category": "terms",
    "text": "DRF da OrderingFilter sukut bo‘yicha qaysi URL query parametr nomidan foydalanadi?",
    "options": {
      "A": "ordering",
      "B": "sort",
      "C": "order_by",
      "D": "direction"
    },
    "correctOption": "A",
    "explanation": "OrderingFilter standart holda ?ordering=field_name query parametrini o‘qiydi (ORDERING_PARAM orqali o‘zgartirish mumkin)."
  },
  {
    "id": "fe-q7",
    "topicId": "final-exam",
    "sourceTopicId": "topic-7",
    "type": "mcq",
    "difficulty": "easy",
    "category": "theory",
    "text": "LimitOffsetPagination da 'offset=30' parametri nimani anglatadi?",
    "options": {
      "A": "30-sahifadagi barcha elementlarni olishni",
      "B": "So‘rovni 30 soniyadan keyin bajarishni",
      "C": "Dastlabki 30 ta elementni o‘tkazib yuborishni",
      "D": "Natijadan jami 30 ta element qaytarishni"
    },
    "correctOption": "C",
    "explanation": "offset=30 dastlabki 30 ta yozuvni o‘tkazib yuborib, 31-yozuvdan boshlab limit miqdoricha obyekt qaytaradi."
  },
  {
    "id": "fe-q8",
    "topicId": "final-exam",
    "sourceTopicId": "topic-8",
    "type": "mcq",
    "difficulty": "easy",
    "category": "practical",
    "text": "Frontend ilovadan DRF endpointiga rasm yuklashda JavaScript da qaysi obyekt ishlatiladi?",
    "options": {
      "A": "URLSearchParams",
      "B": "LocalStorage",
      "C": "JSON.stringify",
      "D": "FormData"
    },
    "correctOption": "D",
    "explanation": "FormData obyekti fayl va matn maydonlarini avtomatik multipart/form-data formatida serverga yuboradi."
  },
  {
    "id": "fe-q9",
    "topicId": "final-exam",
    "sourceTopicId": "topic-1",
    "type": "mcq",
    "difficulty": "medium",
    "category": "theory",
    "text": "Quyidagi HTTP javob sarlavhalari qaysi format va kesh siyosatini ko‘rsatmoqda?",
    "code": "HTTP/1.1 200 OK\nContent-Type: application/json\nCache-Control: max-age=300",
    "options": {
      "A": "XML javob va 300 kun keshlash ruxsati",
      "B": "Fayl yuklab olish va 300 bayt cheklovi",
      "C": "JSON javob va 5 daqiqa (300 soniya) keshlash ruxsati",
      "D": "HTML javob va keshlashni butunlay taqiqlash"
    },
    "correctOption": "C",
    "explanation": "Content-Type: application/json JSON javobni, max-age=300 esa mijoz/proxy uni 300 soniya (5 daqiqa) keshlashi mumkinligini bildiradi.",
    "codeExplanation": "Cache-Control REST ning keshlanuvchanlik prinsipini amalga oshiradi."
  },
  {
    "id": "fe-q10",
    "topicId": "final-exam",
    "sourceTopicId": "topic-2",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi Django modelida 'related_name=\"lessons\"' nima imkoniyat beradi?",
    "code": "class Lesson(models.Model):\n    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons')\n    title = models.CharField(max_length=120)",
    "options": {
      "A": "Jadval nomini PostgreSQL da lessons ga o‘zgartirish",
      "B": "Lesson modelini avtomatik serializatsiya qilish",
      "C": "course maydonini ixtiyoriy (null=True) qilish",
      "D": "course.lessons.all() orqali kurs darslarini olish"
    },
    "correctOption": "D",
    "explanation": "related_name teskari bog‘lanish (reverse relation) nomini standart lesson_set o‘rniga qulay course.lessons ga o‘zgartiradi.",
    "codeExplanation": "Nested serializerlarda ham source='lessons' yoki lessons maydoni sifatida juda qulay."
  },
  {
    "id": "fe-q11",
    "topicId": "final-exam",
    "sourceTopicId": "topic-3",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi urls.py da ViewSet ni oddiy path() bilan ulashda qanday xato qilingan?",
    "code": "urlpatterns = [\n    path('courses/', CourseViewSet.as_view()),\n]",
    "options": {
      "A": "as_view() ga metodlar lug‘ati ({'get': 'list'}) berilmagan",
      "B": "path() funksiyasi o‘rniga re_path() ishlatilishi shart",
      "C": "CourseViewSet klassida .as_view() metodi mavjud emas",
      "D": "URL manzili 'courses/' o‘rniga '/courses' bo‘lishi kerak"
    },
    "correctOption": "A",
    "explanation": "ViewSet router orqali emas, qo‘lda as_view() bilan ulansa actions lug‘ati ({'get': 'list', 'post': 'create'}) berilishi shart, aks holda TypeError chiqadi.",
    "codeExplanation": "Amaliyotda ViewSet lar uchun DefaultRouter/SimpleRouter ishlatiladi."
  },
  {
    "id": "fe-q12",
    "topicId": "final-exam",
    "sourceTopicId": "topic-4",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi SimpleJWT URL konfiguratsiyasida '/api/token/refresh/' endpointiga nima yuboriladi?",
    "code": "from rest_framework_simplejwt.views import TokenRefreshView\n\npath('api/token/refresh/', TokenRefreshView.as_view())",
    "options": {
      "A": "GET so‘rovida foydalanuvchi paroli",
      "B": "DELETE so‘rovida {'access': '<access_token>'}",
      "C": "PUT so‘rovida foydalanuvchi emaili",
      "D": "POST so‘rovida {'refresh': '<refresh_token>'}"
    },
    "correctOption": "D",
    "explanation": "TokenRefreshView POST so‘rovi orqali joriy refresh tokenni qabul qilib, yangi access token qaytaradi.",
    "codeExplanation": "Access token muddati tugaganda foydalanuvchini qayta login qildirmaslik uchun ishlatiladi."
  },
  {
    "id": "fe-q13",
    "topicId": "final-exam",
    "sourceTopicId": "topic-5",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi funksiya view da @permission_classes nega ishlamayapti?",
    "code": "@permission_classes([IsAdminUser])\n@api_view(['DELETE'])\ndef wipe_cache(request):\n    return Response({'cleared': True})",
    "options": {
      "A": "@api_view dekoratori @permission_classes dan yuqorida turishi shart",
      "B": "@permission_classes ichida ro‘yxat emas, satr bo‘lishi kerak",
      "C": "IsAdminUser DELETE metodida ishlamaydi",
      "D": "Funksiya view da Response qaytarib bo‘lmaydi"
    },
    "correctOption": "A",
    "explanation": "Python dekoratorlari pastdan yuqoriga qo‘llaniladi; @api_view har doim eng tashqi (eng yuqori) dekorator bo‘lishi kerak.",
    "codeExplanation": "To‘g‘ri tartib: birinchi @api_view(['DELETE']), keyin @permission_classes([IsAdminUser])."
  },
  {
    "id": "fe-q14",
    "topicId": "final-exam",
    "sourceTopicId": "topic-6",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi ViewSet qaysi uchta imkoniyatni bir vaqtning o‘zida qo‘llab-quvvatlaydi?",
    "code": "class BookViewSet(viewsets.ModelViewSet):\n    queryset = Book.objects.all()\n    serializer_class = BookSerializer\n    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]\n    filterset_fields = ['author']\n    search_fields = ['title']\n    ordering_fields = ['published_year']",
    "options": {
      "A": "Faqat muallif bo‘yicha filtr (qolgan ikkitasi e'tiborsiz qoladi)",
      "B": "Muallif bo‘yicha filtr, nomdan qidiruv va yil bo‘yicha tartiblash",
      "C": "Sahifalash, throttling va fayl yuklash",
      "D": "Autentifikatsiya, avtorizatsiya va keshlash"
    },
    "correctOption": "B",
    "explanation": "Uchala filter backend ro‘yxatda birga berilgani uchun /api/books/?author=1&search=drf&ordering=-published_year so‘rovi to‘liq ishlaydi.",
    "codeExplanation": "DRF filter_backends ro‘yxatidagi barcha backendlarni ketma-ket queryset ga tatbiq etadi."
  },
  {
    "id": "fe-q15",
    "topicId": "final-exam",
    "sourceTopicId": "topic-7",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi LimitOffsetPagination sozlamasida mijoz '?limit=200&offset=10' yuborsa, nechta obyekt qaytadi?",
    "code": "class CustomLimitOffset(LimitOffsetPagination):\n    default_limit = 15\n    max_limit = 50",
    "options": {
      "A": "15 ta obyekt",
      "B": "200 ta obyekt",
      "C": "50 ta obyekt",
      "D": "10 ta obyekt"
    },
    "correctOption": "C",
    "explanation": "max_limit = 50 mijoz so‘rashi mumkin bo‘lgan maksimal limitni 50 taga cheklaydi, shuning uchun 200 o‘rniga 50 ta qaytadi.",
    "codeExplanation": "Mijoz limit bermasa default_limit = 15 qo‘llaniladi."
  },
  {
    "id": "fe-q16",
    "topicId": "final-exam",
    "sourceTopicId": "topic-8",
    "type": "mcq",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi Serializer da rasm yuklash maydoni uchun qanday xato bor?",
    "code": "class BannerSerializer(serializers.ModelSerializer):\n    image = serializers.CharField()\n\n    class Meta:\n        model = Banner\n        fields = ['id', 'title', 'image']",
    "options": {
      "A": "BannerSerializer APIView dan meros olishi shart",
      "B": "image CharField qilib qayta yozilgan, fayl obyekti qabul qilmaydi",
      "C": "Meta ichida model=Banner noto‘g‘ri joylashgan",
      "D": "fields ro‘yxatida id bo‘lmasligi kerak"
    },
    "correctOption": "B",
    "explanation": "image maydoni CharField bilan override qilingani uchun multipart fayl o‘rniga faqat matn kutadi; ImageField qoldirilishi kerak.",
    "codeExplanation": "ModelSerializer modeldagi ImageField ni avtomatik serializers.ImageField ga bog‘laydi."
  },
  {
    "id": "fe-q17",
    "topicId": "final-exam",
    "sourceTopicId": "topic-9",
    "type": "mcq",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi pytest fixture kodi nima qaytaradi va qanday ishlatiladi?",
    "code": "@pytest.fixture\ndef auth_client(user):\n    client = APIClient()\n    client.force_authenticate(user=user)\n    return client",
    "options": {
      "A": "Yangi Django foydalanuvchisini yaratib o‘chiradi",
      "B": "Autentifikatsiya qilingan tayyor APIClient obyektini qaytaradi",
      "C": "Swagger hujjatini YAML formatida eksport qiladi",
      "D": "Faqat bitta GET so‘rovini bajarib status kodni qaytaradi"
    },
    "correctOption": "B",
    "explanation": "auth_client fixture boshqa user fixture ga tayanadi va test funksiyalariga tayyor autentifikatsiya qilingan APIClient uzatadi.",
    "codeExplanation": "Test funksiyasida def test_profile(auth_client): deb yozish kifoya."
  },
  {
    "id": "fe-q18",
    "topicId": "final-exam",
    "sourceTopicId": "topic-9",
    "type": "mcq",
    "difficulty": "medium",
    "category": "terms",
    "text": "API hujjatlashtirishda Swagger UI ning asosiy afzalligi qaysi tugma/imkoniyat bilan bog‘liq?",
    "options": {
      "A": "Ma'lumotlar bazasini avtomatik zaxiralash (backup)",
      "B": "Python kodini JavaScript ga tarjima qilish",
      "C": "Brauzerning o‘zidan 'Try it out' orqali jonli so‘rov yuborish",
      "D": "Django migratsiyalarini ishga tushirish"
    },
    "correctOption": "C",
    "explanation": "Swagger UI ning 'Try it out' funksiyasi dasturchilarga Postman ochmasdan turib endpointlarni hujjat sahifasida sinab ko‘rish imkonini beradi."
  },
  {
    "id": "fe-q19",
    "topicId": "final-exam",
    "sourceTopicId": "topic-3",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "Nested (ichma-ich) Serializer da read-only ro‘yxat chiqarish oson, ammo POST da obyekt yaratishda nima qilish talab etiladi?",
    "options": {
      "A": "DefaultRouter ni SimpleRouter ga almashtirish",
      "B": "Serializer ning create() metodini override qilish",
      "C": "Serializer chaqiruvida many=False berib qo‘yish",
      "D": "ModelSerializer o‘rniga APIView ga o‘tish"
    },
    "correctOption": "B",
    "explanation": "DRF standart ModelSerializer.create() ichma-ich (writable nested) obyektlarni avtomatik yaratmaydi; create() va update() metodlari qo‘lda yoziladi."
  },
  {
    "id": "fe-q20",
    "topicId": "final-exam",
    "sourceTopicId": "topic-4",
    "type": "mcq",
    "difficulty": "medium",
    "category": "practical",
    "text": "Frontend da JWT Access Tokenni XSS hujumlaridan himoyalash uchun eng xavfsiz saqlash usuli qaysi?",
    "options": {
      "A": "URL query parametrida saqlash",
      "B": "Global window.token o‘zgaruvchisida saqlash",
      "C": "HTML data-token atributida saqlash",
      "D": "HttpOnly + Secure + SameSite cookie da saqlash"
    },
    "correctOption": "D",
    "explanation": "HttpOnly cookie JavaScript (document.cookie) orqali o‘qilmaydi, shu sababli XSS hujumida token o‘g‘irlanishidan himoya qiladi."
  },
  {
    "id": "fe-q21",
    "topicId": "final-exam",
    "sourceTopicId": "topic-5",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Quyidagi custom permission klassi qachon True qaytaradi?",
    "code": "class IsMentorOrOwner(BasePermission):\n    def has_object_permission(self, request, view, obj):\n        return request.user.is_staff or obj.student == request.user",
    "options": {
      "A": "Har qanday anonim foydalanuvchi murojaat qilganda",
      "B": "Foydalanuvchi ham xodim, ham obyekt egasi bo‘lsa",
      "C": "Faqat xavfsiz GET so‘rovlari yuborilganda",
      "D": "Foydalanuvchi xodim bo‘lsa YOKI obyekt egasi bo‘lsa"
    },
    "correctOption": "D",
    "explanation": "or operatori tufayli xodim (mentor/admin) barcha obyektlarga, oddiy talaba esa faqat o‘zining obyektiga kira oladi.",
    "codeExplanation": "Bu ta'lim platformalarida mentor va talaba huquqlarini ajratishning klassik namunasi."
  },
  {
    "id": "fe-q22",
    "topicId": "final-exam",
    "sourceTopicId": "topic-7",
    "type": "mcq",
    "difficulty": "hard",
    "category": "code_analysis",
    "text": "Quyidagi DRF sozlamasida 1 soat ichida 61-so‘rovni yuborgan anonim mijoz qanday javob oladi?",
    "code": "REST_FRAMEWORK = {\n    'DEFAULT_THROTTLE_CLASSES': ['rest_framework.throttling.AnonRateThrottle'],\n    'DEFAULT_THROTTLE_RATES': {'anon': '60/hour'},\n}",
    "options": {
      "A": "429 Too Many Requests va Retry-After sarlavhasi",
      "B": "200 OK, lekin bo‘sh ro‘yxat",
      "C": "503 Service Unavailable",
      "D": "403 Forbidden va bo‘sh tana"
    },
    "correctOption": "A",
    "explanation": "60/hour limiti tugagach 61-so‘rov rad etiladi va DRF 429 status kodi bilan qancha soniya kutish kerakligini bildiruvchi Retry-After sarlavhasini qaytaradi.",
    "codeExplanation": "AnonRateThrottle IP manzil bo‘yicha 60 ta so‘rovni keshda hisoblaydi."
  },
  {
    "id": "fe-q23",
    "topicId": "final-exam",
    "sourceTopicId": "topic-6",
    "type": "mcq",
    "difficulty": "hard",
    "category": "bug_finding",
    "text": "Quyidagi ViewSet da 'ordering_fields = \"__all__\"' qoldirilishi qanday xavf tug‘diradi?",
    "code": "class UserViewSet(viewsets.ReadOnlyModelViewSet):\n    queryset = User.objects.all()\n    serializer_class = PublicUserSerializer\n    filter_backends = [OrderingFilter]\n    ordering_fields = '__all__'",
    "options": {
      "A": "Mijoz maxfiy maydonlar bo‘yicha saralashi mumkin",
      "B": "Barcha foydalanuvchilar bazadan o‘chib ketadi",
      "C": "Faqat id maydoni bo‘yicha saralash ishlaydi",
      "D": "OrderingFilter '__all__' qiymatida xato chiqaradi"
    },
    "correctOption": "A",
    "explanation": "ordering_fields = '__all__' serializerda yashirilgan model ustunlari (masalan, password, email) bo‘yicha ham saralashga yo‘l ochib, yon kanal (side-channel) xavfini yaratadi.",
    "codeExplanation": "Har doim ruxsat etilgan maydonlarni aniq ro‘yxatda (['id', 'username']) ko‘rsatish kerak."
  },
  {
    "id": "fe-q24",
    "topicId": "final-exam",
    "sourceTopicId": "topic-8",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "DRF API da foydalanuvchi 500 MB hajmli video yuklashi kerak. Server workerlarini band qilmaslik uchun eng to‘g‘ri arxitektura qaysi?",
    "options": {
      "A": "Videoni Base64 qilib bitta JSON ichida DRF ga yuborish",
      "B": "Videoni PostgreSQL ning BinaryField ustuniga yozish",
      "C": "Django runserver ni 100 ta thread bilan ochish",
      "D": "S3 Presigned URL berish va faylni brauzerdan to‘g‘ridan-to‘g‘ri S3 ga yuklash"
    },
    "correctOption": "D",
    "explanation": "Presigned URL orqali katta fayllar Django/Gunicorn workerlarini chetlab o‘tib to‘g‘ridan-to‘g‘ri S3 obyekt xotirasiga yuklanadi."
  },
  {
    "id": "fe-q25",
    "topicId": "final-exam",
    "sourceTopicId": "topic-9",
    "type": "mcq",
    "difficulty": "hard",
    "category": "practical",
    "text": "CI/CD (GitHub Actions) jarayonida har bir Pull Request ochilganda DRF loyihasining barqarorligini tekshirish uchun eng muhim qadam qaysi?",
    "options": {
      "A": "Barcha test fayllarini o‘chirib tashlash",
      "B": "Postman dasturini qo‘lda ochib tekshirish",
      "C": "Avtomatik pytest/manage.py test va migratsiya tekshiruvini ishga tushirish",
      "D": "DEBUG=True qilib production serverga to‘g‘ridan-to‘g‘ri yuklash"
    },
    "correctOption": "C",
    "explanation": "CI quvurida avtomatik testlar, migratsiya izchilligi (makemigrations --check) va linterlar ishga tushirilishi xatoli kodning main tarmog‘iga o‘tishini to‘sadi."
  },
  {
    "id": "fe-q26",
    "topicId": "final-exam",
    "sourceTopicId": "topic-1",
    "type": "open",
    "difficulty": "easy",
    "category": "terms",
    "text": "Brauzerda turli domenlar o‘rtasida API so‘rovlarini boshqaruvchi xavfsizlik mexanizmining 4 harfli qisqartmasini yozing.",
    "acceptedAnswers": [
      "CORS",
      "cors"
    ],
    "requiresMentorReview": false,
    "explanation": "CORS (Cross-Origin Resource Sharing) frontend va backend turli domen/portlarda ishlaganda so‘rovlarga ruxsat berish mexanizmidir."
  },
  {
    "id": "fe-q27",
    "topicId": "final-exam",
    "sourceTopicId": "topic-2",
    "type": "open",
    "difficulty": "medium",
    "category": "code_analysis",
    "text": "Quyidagi ForeignKey bog‘lanishida ota obyekt o‘chirilganda unga bog‘langan yozuvlar o‘chishini bloklovchi on_delete qiymatini yozing.",
    "code": "category = models.ForeignKey(Category, on_delete=models.________)",
    "acceptedAnswers": [
      "PROTECT",
      "models.PROTECT"
    ],
    "requiresMentorReview": false,
    "explanation": "models.PROTECT bog‘langan yozuvlar mavjud bo‘lsa ota obyektni o‘chirishga yo‘l qo‘ymaydi va ProtectedError tashlaydi.",
    "codeExplanation": "Bu muhim katalog yoki moliyaviy yozuvlar tasodifan o‘chib ketishidan himoya qiladi."
  },
  {
    "id": "fe-q28",
    "topicId": "final-exam",
    "sourceTopicId": "topic-3",
    "type": "open",
    "difficulty": "medium",
    "category": "bug_finding",
    "text": "Quyidagi ViewSet da ForeignKey (author) bilan bog‘liq N+1 SQL muammosini bartaraf etuvchi QuerySet metodini yozing.",
    "code": "queryset = Article.objects.________('author')",
    "acceptedAnswers": [
      "select_related"
    ],
    "requiresMentorReview": false,
    "explanation": "select_related('author') ForeignKey va OneToOne bog‘lanishlarni bitta SQL JOIN so‘rovida yuklaydi.",
    "codeExplanation": "ManyToMany va teskari ForeignKey uchun esa prefetch_related() ishlatiladi."
  },
  {
    "id": "fe-q29",
    "topicId": "final-exam",
    "sourceTopicId": "topic-5",
    "type": "open",
    "difficulty": "medium",
    "category": "theory",
    "text": "401 Unauthorized va 403 Forbidden HTTP status kodlari o‘rtasidagi farqni qisqacha tushuntiring.",
    "acceptedAnswers": [
      "401 autentifikatsiya qilinmagan 403 kirgan lekin ruxsati yoq",
      "401 login qilmagan 403 ruxsat yoq"
    ],
    "requiresMentorReview": true,
    "explanation": "401 Unauthorized foydalanuvchi autentifikatsiyadan o‘tmaganini (yoki token yaroqsizligini), 403 Forbidden esa tizimga kirgan bo‘lsa-da ushbu amalga ruxsati yo‘qligini bildiradi."
  },
  {
    "id": "fe-q30",
    "topicId": "final-exam",
    "sourceTopicId": "topic-9",
    "type": "open",
    "difficulty": "hard",
    "category": "practical",
    "text": "drf-spectacular o‘rnatilganda settings.py dagi REST_FRAMEWORK['DEFAULT_SCHEMA_CLASS'] ga yoziladigan to‘liq klass yo‘lini kiriting.",
    "acceptedAnswers": [
      "drf_spectacular.openapi.AutoSchema",
      "'drf_spectacular.openapi.AutoSchema'"
    ],
    "requiresMentorReview": false,
    "explanation": "drf_spectacular.openapi.AutoSchema DRF view va serializerlaridan OpenAPI 3 sxemasini avtomatik generatsiya qiladi."
  }
];

const STORAGE_KEYS = {
  TOPICS: 'drf_academy_topics_v2',
  QUESTIONS: 'drf_academy_questions_v2',
  ATTEMPTS: 'drf_academy_attempts_v2',
  USERS: 'drf_academy_users_v2',
  SESSION: 'drf_academy_session_v2',
  CLOUD: 'drf_academy_cloud_v2'
};

const SUPABASE_SQL_SCHEMA = `-- DRF ACADEMY — Supabase (PostgreSQL) jadval tuzilmasi
create table if not exists drf_users (
  id text primary key,
  full_name text not null,
  username text unique not null,
  password_hash text not null,
  role text not null check (role in ('student', 'mentor')),
  group_name text,
  created_at timestamptz default now()
);

create table if not exists drf_attempts (
  id text primary key,
  student_id text not null,
  student_name text not null,
  student_group text,
  topic_id text not null,
  topic_title text not null,
  started_at timestamptz,
  completed_at timestamptz default now(),
  duration_seconds int default 0,
  total_questions int not null,
  score int not null,
  percentage int not null,
  correct_count int not null,
  wrong_count int not null,
  unanswered_count int not null,
  pending_review_count int default 0,
  is_provisional boolean default false,
  is_retry_mode boolean default false,
  results jsonb not null
);

-- Masofaviy hostingda brauzer orqali yozish/o'qish uchun ruxsatlar
alter table drf_users enable row level security;
alter table drf_attempts enable row level security;
drop policy if exists "drf_users_all" on drf_users;
create policy "drf_users_all" on drf_users for all using (true) with check (true);
drop policy if exists "drf_attempts_all" on drf_attempts;
create policy "drf_attempts_all" on drf_attempts for all using (true) with check (true);`;

const DIFFICULTY_META: Record<Difficulty, { label: string; badge: string }> = {
  easy: { label: 'Oson', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium: { label: 'O‘rta', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  hard: { label: 'Murakkab', badge: 'bg-rose-50 text-rose-700 border-rose-200' }
};

const CATEGORY_META: Record<QuestionCategory, string> = {
  theory: 'Nazariy bilim',
  terms: 'Atamalar va prinsip',
  code_analysis: 'Kod tahlili',
  bug_finding: 'Xato topish',
  practical: 'Amaliy vaziyat'
};

// ============================================================================
// SAFE STORAGE & HELPERS
// ============================================================================
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable
  }
}

function normalizeAnswer(val: string): string {
  return val
    .trim()
    .toLowerCase()
    .replace(/[‘’`']/g, "'")
    .replace(/\s+/g, ' ');
}

function getGradeInfo(score: number, total: number): {
  label: string;
  passed: boolean;
  colorClass: string;
  bgClass: string;
} {
  const scaled = total > 0 ? Math.round((score / total) * 30) : 0;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  if (total === 30) {
    if (score >= 27) return { label: "A'lo", passed: true, colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50 border-emerald-200' };
    if (score >= 23) return { label: 'Yaxshi', passed: true, colorClass: 'text-blue-700', bgClass: 'bg-blue-50 border-blue-200' };
    if (score >= 18) return { label: "O‘tish chegarasidan muvaffaqiyatli o‘tdi", passed: true, colorClass: 'text-teal-700', bgClass: 'bg-teal-50 border-teal-200' };
    return { label: 'Talabga javob bermadi', passed: false, colorClass: 'text-rose-700', bgClass: 'bg-rose-50 border-rose-200' };
  }
  if (pct >= 90 || scaled >= 27) return { label: "A'lo", passed: true, colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50 border-emerald-200' };
  if (pct >= 77 || scaled >= 23) return { label: 'Yaxshi', passed: true, colorClass: 'text-blue-700', bgClass: 'bg-blue-50 border-blue-200' };
  if (pct >= 60) return { label: "O‘tish chegarasidan muvaffaqiyatli o‘tdi", passed: true, colorClass: 'text-teal-700', bgClass: 'bg-teal-50 border-teal-200' };
  return { label: 'Talabga javob bermadi', passed: false, colorClass: 'text-rose-700', bgClass: 'bg-rose-50 border-rose-200' };
}

function evaluateOpenAnswer(question: Question, rawAnswer: string): 'correct' | 'wrong' | 'unanswered' | 'pending_review' {
  const cleaned = normalizeAnswer(rawAnswer);
  if (!cleaned) return 'unanswered';
  const accepted = (question.acceptedAnswers || []).map(normalizeAnswer);
  if (accepted.includes(cleaned)) return 'correct';

  if (question.requiresMentorReview) {
    const keyTokens = accepted
      .join(' ')
      .split(' ')
      .filter((w) => w.length >= 4);
    const uniqueTokens = Array.from(new Set(keyTokens));
    const matched = uniqueTokens.filter((tok) => cleaned.includes(tok));
    if (uniqueTokens.length >= 3 && matched.length >= Math.ceil(uniqueTokens.length * 0.65)) {
      return 'correct';
    }
    return 'pending_review';
  }
  return 'wrong';
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

function copyTextSafe(text: string): boolean {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
}

// Read Vite env vars safely (works on Vercel/Netlify hosting and gracefully falls back in preview)
function getDefaultCloudConfig(): CloudConfig {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string> })?.env;
    const url = (env?.VITE_SUPABASE_URL || '').trim();
    const key = (env?.VITE_SUPABASE_ANON_KEY || '').trim();
    if (url.startsWith('https://') && key.length > 10) {
      return { supabaseUrl: url, supabaseAnonKey: key, enabled: true };
    }
  } catch {
    // ignore in non-Vite environments
  }
  return { supabaseUrl: '', supabaseAnonKey: '', enabled: false };
}

async function pushUserToCloud(cloud: CloudConfig, user: UserAccount): Promise<boolean> {
  if (!cloud.enabled || !cloud.supabaseUrl.startsWith('https://') || !cloud.supabaseAnonKey) return false;
  try {
    const endpoint = `${cloud.supabaseUrl.replace(/\/$/, '')}/rest/v1/drf_users`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: cloud.supabaseAnonKey,
        Authorization: `Bearer ${cloud.supabaseAnonKey}`,
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: user.id,
        full_name: user.fullName,
        username: user.username,
        password_hash: user.passwordHash,
        role: user.role,
        group_name: user.groupName || null,
        created_at: user.createdAt
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function deleteUserFromCloud(cloud: CloudConfig, userId: string): Promise<boolean> {
  if (!cloud.enabled || !cloud.supabaseUrl.startsWith('https://') || !cloud.supabaseAnonKey) return false;
  try {
    const endpoint = `${cloud.supabaseUrl.replace(/\/$/, '')}/rest/v1/drf_users?id=eq.${encodeURIComponent(userId)}`;
    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        apikey: cloud.supabaseAnonKey,
        Authorization: `Bearer ${cloud.supabaseAnonKey}`
      }
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchUsersFromCloud(cloud: CloudConfig): Promise<UserAccount[] | null> {
  if (!cloud.enabled || !cloud.supabaseUrl.startsWith('https://') || !cloud.supabaseAnonKey) return null;
  try {
    const endpoint = `${cloud.supabaseUrl.replace(/\/$/, '')}/rest/v1/drf_users?select=*&order=created_at.desc`;
    const res = await fetch(endpoint, {
      headers: {
        apikey: cloud.supabaseAnonKey,
        Authorization: `Bearer ${cloud.supabaseAnonKey}`
      }
    });
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows)) return null;
    return rows.map((r: Record<string, unknown>) => ({
      id: String(r.id),
      fullName: String(r.full_name || ''),
      username: String(r.username || ''),
      passwordHash: String(r.password_hash || ''),
      role: (r.role === 'mentor' ? 'mentor' : 'student') as UserRole,
      groupName: r.group_name ? String(r.group_name) : undefined,
      createdAt: String(r.created_at || new Date().toISOString())
    }));
  } catch {
    return null;
  }
}

// Optional Supabase REST push when mentor configures cloud hosting
async function pushAttemptToCloud(cloud: CloudConfig, attempt: Attempt): Promise<boolean> {
  if (!cloud.enabled || !cloud.supabaseUrl.startsWith('https://') || !cloud.supabaseAnonKey) return false;
  try {
    const endpoint = `${cloud.supabaseUrl.replace(/\/$/, '')}/rest/v1/drf_attempts`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: cloud.supabaseAnonKey,
        Authorization: `Bearer ${cloud.supabaseAnonKey}`,
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: attempt.id,
        student_id: attempt.studentId,
        student_name: attempt.studentName,
        student_group: attempt.studentGroup || null,
        topic_id: attempt.topicId,
        topic_title: attempt.topicTitle,
        started_at: attempt.startedAt,
        completed_at: attempt.completedAt,
        duration_seconds: attempt.durationSeconds,
        total_questions: attempt.totalQuestions,
        score: attempt.score,
        percentage: attempt.percentage,
        correct_count: attempt.correctCount,
        wrong_count: attempt.wrongCount,
        unanswered_count: attempt.unansweredCount,
        pending_review_count: attempt.pendingReviewCount,
        is_provisional: attempt.isProvisional,
        is_retry_mode: Boolean(attempt.isRetryMode),
        results: attempt.results
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchAttemptsFromCloud(cloud: CloudConfig): Promise<Attempt[] | null> {
  if (!cloud.enabled || !cloud.supabaseUrl.startsWith('https://') || !cloud.supabaseAnonKey) return null;
  try {
    const endpoint = `${cloud.supabaseUrl.replace(/\/$/, '')}/rest/v1/drf_attempts?select=*&order=completed_at.desc`;
    const res = await fetch(endpoint, {
      headers: {
        apikey: cloud.supabaseAnonKey,
        Authorization: `Bearer ${cloud.supabaseAnonKey}`
      }
    });
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows)) return null;
    return rows.map((r: Record<string, unknown>) => ({
      id: String(r.id),
      studentId: String(r.student_id),
      studentName: String(r.student_name),
      studentGroup: r.student_group ? String(r.student_group) : undefined,
      topicId: String(r.topic_id),
      topicTitle: String(r.topic_title),
      startedAt: String(r.started_at || r.completed_at),
      completedAt: String(r.completed_at),
      durationSeconds: Number(r.duration_seconds || 0),
      totalQuestions: Number(r.total_questions || 30),
      score: Number(r.score || 0),
      percentage: Number(r.percentage || 0),
      correctCount: Number(r.correct_count || 0),
      wrongCount: Number(r.wrong_count || 0),
      unansweredCount: Number(r.unanswered_count || 0),
      pendingReviewCount: Number(r.pending_review_count || 0),
      isProvisional: Boolean(r.is_provisional),
      isRetryMode: Boolean(r.is_retry_mode),
      results: Array.isArray(r.results) ? (r.results as QuestionResult[]) : []
    }));
  } catch {
    return null;
  }
}

// ============================================================================
// SYNTAX HIGHLIGHTED CODE BLOCK
// ============================================================================
const PY_KEYWORDS = new Set([
  'from', 'import', 'class', 'def', 'return', 'if', 'elif', 'else', 'in', 'not',
  'and', 'or', 'True', 'False', 'None', 'raise', 'with', 'as', 'for', 'pass',
  'assert', 'self', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'HTTP'
]);

function highlightLine(line: string): React.ReactNode[] {
  const commentIdx = line.indexOf('#');
  const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
  const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : '';

  const tokens: React.ReactNode[] = [];
  const regex = /(@[A-Za-z_][\w.]*)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")|(\b\d+\b)|(\b[A-Za-z_][A-Za-z0-9_]*\b)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = regex.exec(codePart)) !== null) {
    if (match.index > lastIdx) {
      tokens.push(<span key={`t-${keyCounter++}`} className="text-slate-200">{codePart.slice(lastIdx, match.index)}</span>);
    }
    const [full, dec, str, num, ident] = match;
    if (dec) {
      tokens.push(<span key={`t-${keyCounter++}`} className="text-amber-300 font-medium">{dec}</span>);
    } else if (str) {
      tokens.push(<span key={`t-${keyCounter++}`} className="text-emerald-300">{str}</span>);
    } else if (num) {
      tokens.push(<span key={`t-${keyCounter++}`} className="text-orange-300">{num}</span>);
    } else if (ident) {
      if (PY_KEYWORDS.has(ident)) {
        tokens.push(<span key={`t-${keyCounter++}`} className="text-sky-400 font-semibold">{ident}</span>);
      } else if (/^[A-Z]/.test(ident)) {
        tokens.push(<span key={`t-${keyCounter++}`} className="text-indigo-300">{ident}</span>);
      } else {
        tokens.push(<span key={`t-${keyCounter++}`} className="text-slate-100">{ident}</span>);
      }
    } else {
      tokens.push(<span key={`t-${keyCounter++}`}>{full}</span>);
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < codePart.length) {
    tokens.push(<span key={`t-${keyCounter++}`} className="text-slate-200">{codePart.slice(lastIdx)}</span>);
  }
  if (commentPart) {
    tokens.push(<span key={`t-${keyCounter++}`} className="text-slate-400 italic">{commentPart}</span>);
  }
  return tokens;
}

const CodeBlock: React.FC<{ code: string; label?: string }> = ({ code, label = 'Python / DRF' }) => {
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n');

  const handleCopy = () => {
    if (copyTextSafe(code)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700/80 bg-[#0B1528] shadow-sm my-3">
      <div className="flex items-center justify-between px-4 py-2 bg-[#101F3B] border-b border-slate-700/70">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-2 text-xs font-mono text-slate-300">{label}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2 py-1 rounded-md hover:bg-slate-700/60 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Nusxalandi' : 'Nusxalash'}</span>
        </button>
      </div>
      <div className="p-4 overflow-x-auto font-mono text-[13px] leading-6">
        {lines.map((line, i) => (
          <div key={i} className="flex">
            <span className="select-none w-7 shrink-0 text-right pr-3 text-slate-500 text-xs leading-6">
              {i + 1}
            </span>
            <pre className="whitespace-pre font-mono">{highlightLine(line)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN APPLICATION (ALOHIDA O‘QUVCHI VA MENTOR PORTALLARI + PAROLLI KIRISH)
// ============================================================================
type StudentPageView =
  | { name: 'home' }
  | { name: 'topics' }
  | { name: 'topic_detail'; topicId: string }
  | { name: 'final_exam_intro' }
  | { name: 'quiz'; topicId: string; customQuestions?: Question[]; isRetry?: boolean }
  | { name: 'results'; attemptId: string }
  | { name: 'mistakes' }
  | { name: 'history' };

export default function App() {
  const [topics, setTopics] = useState<Topic[]>(() =>
    loadFromStorage<Topic[]>(STORAGE_KEYS.TOPICS, INITIAL_TOPICS)
  );
  const [questions, setQuestions] = useState<Question[]>(() =>
    loadFromStorage<Question[]>(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS)
  );
  const [attempts, setAttempts] = useState<Attempt[]>(() =>
    loadFromStorage<Attempt[]>(STORAGE_KEYS.ATTEMPTS, [])
  );
  const [users, setUsers] = useState<UserAccount[]>(() =>
    loadFromStorage<UserAccount[]>(STORAGE_KEYS.USERS, INITIAL_USERS)
  );
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    loadFromStorage<UserAccount | null>(STORAGE_KEYS.SESSION, null)
  );
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>(() => {
    const envCfg = getDefaultCloudConfig();
    if (envCfg.enabled) return envCfg;
    return loadFromStorage<CloudConfig>(STORAGE_KEYS.CLOUD, envCfg);
  });

  const [studentView, setStudentView] = useState<StudentPageView>({ name: 'home' });
  const [mentorViewingAttemptId, setMentorViewingAttemptId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => { saveToStorage(STORAGE_KEYS.TOPICS, topics); }, [topics]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.QUESTIONS, questions); }, [questions]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.ATTEMPTS, attempts); }, [attempts]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.USERS, users); }, [users]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.SESSION, currentUser); }, [currentUser]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.CLOUD, cloudConfig); }, [cloudConfig]);

  // Sync users & attempts from Supabase when cloud is enabled
  const syncAllFromCloud = async (cfg: CloudConfig): Promise<{ usersCount: number; attemptsCount: number } | null> => {
    if (!cfg.enabled) return null;
    const [remoteUsers, remoteAttempts] = await Promise.all([
      fetchUsersFromCloud(cfg),
      fetchAttemptsFromCloud(cfg)
    ]);
    if (!remoteUsers && !remoteAttempts) return null;
    if (remoteUsers && remoteUsers.length > 0) {
      setUsers((prev) => {
        const byUsername = new Map<string, UserAccount>();
        for (const u of prev) byUsername.set(u.username.toLowerCase(), u);
        for (const u of remoteUsers) byUsername.set(u.username.toLowerCase(), u);
        return Array.from(byUsername.values());
      });
    }
    if (remoteAttempts && remoteAttempts.length > 0) {
      setAttempts((prev) => {
        const byId = new Map<string, Attempt>();
        for (const a of prev) byId.set(a.id, a);
        for (const a of remoteAttempts) byId.set(a.id, a);
        return Array.from(byId.values()).sort((a, b) => b.completedAt.localeCompare(a.completedAt));
      });
    }
    return { usersCount: remoteUsers?.length || 0, attemptsCount: remoteAttempts?.length || 0 };
  };

  useEffect(() => {
    if (cloudConfig.enabled) {
      syncAllFromCloud(cloudConfig);
    }
  }, [cloudConfig, currentUser]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    setStudentView({ name: 'home' });
    setMentorViewingAttemptId(null);
    showToast(`Xush kelibsiz, ${user.fullName}!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setMobileMenuOpen(false);
    setMentorViewingAttemptId(null);
    showToast('Tizimdan chiqildi.', 'info');
  };

  const handleRegisterStudent = (fullName: string, username: string, password: string, groupName: string): string | null => {
    const cleanUser = username.trim().toLowerCase();
    if (!fullName.trim() || !cleanUser || password.length < 4) {
      return 'Ism, login va kamida 4 belgili parol kiritilishi shart.';
    }
    if (users.some((u) => u.username.toLowerCase() === cleanUser)) {
      return 'Bu login band. Boshqa login tanlang.';
    }
    const newUser: UserAccount = {
      id: `student-${Date.now()}`,
      fullName: fullName.trim(),
      username: cleanUser,
      passwordHash: simpleHash(password),
      role: 'student',
      groupName: groupName.trim() || 'DRF-2026',
      createdAt: new Date().toISOString()
    };
    setUsers((prev) => [...prev, newUser]);
    if (cloudConfig.enabled) {
      pushUserToCloud(cloudConfig, newUser);
    }
    handleLogin(newUser);
    return null;
  };

  const handleFinishQuiz = async (attempt: Attempt) => {
    setAttempts((prev) => [attempt, ...prev]);
    setStudentView({ name: 'results', attemptId: attempt.id });
    if (cloudConfig.enabled) {
      const synced = await pushAttemptToCloud(cloudConfig, attempt);
      if (synced) {
        showToast('Natija saqlandi va bulutli bazaga yuborildi!', 'success');
        return;
      }
    }
    if (attempt.isProvisional) {
      showToast('Test yakunlandi! Yopiq savollar mentor tekshiruviga yuborildi.', 'info');
    } else {
      showToast('Test muvaffaqiyatli yakunlandi va natija saqlandi!', 'success');
    }
  };

  const handleMentorReviewDecision = (attemptId: string, questionId: string, isCorrect: boolean) => {
    setAttempts((prev) =>
      prev.map((att) => {
        if (att.id !== attemptId) return att;
        const newResults = att.results.map((r) => {
          if (r.questionId !== questionId) return r;
          return {
            ...r,
            status: isCorrect ? ('correct' as const) : ('wrong' as const),
            score: isCorrect ? 1 : 0,
            mentorReviewed: true
          };
        });
        const correctCount = newResults.filter((r) => r.status === 'correct').length;
        const wrongCount = newResults.filter((r) => r.status === 'wrong').length;
        const unansweredCount = newResults.filter((r) => r.status === 'unanswered').length;
        const pendingReviewCount = newResults.filter((r) => r.status === 'pending_review').length;
        const score = correctCount;
        const percentage = att.totalQuestions > 0 ? Math.round((score / att.totalQuestions) * 100) : 0;
        const updated: Attempt = {
          ...att,
          results: newResults,
          correctCount,
          wrongCount,
          unansweredCount,
          pendingReviewCount,
          score,
          percentage,
          isProvisional: pendingReviewCount > 0
        };
        if (cloudConfig.enabled) {
          pushAttemptToCloud(cloudConfig, updated);
        }
        return updated;
      })
    );
    showToast(isCorrect ? 'Javob to‘g‘ri deb tasdiqlandi (+1 ball).' : 'Javob noto‘g‘ri deb baholandi (0 ball).', 'success');
  };

  // ==========================================================================
  // 0. AUTH PORTAL (Not logged in -> Dedicated Student / Mentor Login Pages)
  // ==========================================================================
  if (!currentUser) {
    return (
      <>
        <AuthPortalView
          users={users}
          onLogin={handleLogin}
          onRegisterStudent={handleRegisterStudent}
          totalQuestions={questions.length}
          totalTopics={topics.length}
        />
        {toast && <ToastBanner toast={toast} />}
      </>
    );
  }

  // ==========================================================================
  // MENTOR DEDICATED PORTAL
  // ==========================================================================
  if (currentUser.role === 'mentor') {
    const pendingTotal = attempts.reduce((s, a) => s + a.pendingReviewCount, 0);
    return (
      <div className="min-h-screen bg-[#F4F6FA] text-slate-900 font-sans flex flex-col">
        <header className="sticky top-0 z-40 bg-[#0B1D3A] text-white shadow-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[#0B1D3A] shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold tracking-tight text-base leading-tight">DRF ACADEMY • MENTOR</div>
                <div className="text-[11px] text-amber-200/80 leading-tight">Boshqaruv va tahlil portali</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {cloudConfig.enabled && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-medium">
                  <Cloud className="w-3.5 h-3.5" />
                  Bulut ulangan
                </span>
              )}
              {pendingTotal > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-200 text-xs font-semibold">
                  {pendingTotal} ta tekshiruv
                </span>
              )}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 text-xs">
                <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-medium">{currentUser.fullName}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/30 text-rose-100 text-xs font-semibold transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Chiqish</span>
              </button>
            </div>
          </div>
        </header>

        {toast && <ToastBanner toast={toast} />}

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {mentorViewingAttemptId ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setMentorViewingAttemptId(null)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-[#0F2547]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Mentor paneliga qaytish</span>
              </button>
              <ResultsAndAnalysisView
                attempt={attempts.find((a) => a.id === mentorViewingAttemptId)}
                allQuestions={questions}
                isMentorView
                onRetryWrong={() => {}}
                onRetakeFull={() => {}}
                onBackHome={() => setMentorViewingAttemptId(null)}
              />
            </div>
          ) : (
            <MentorPanelView
              topics={topics}
              questions={questions}
              attempts={attempts}
              users={users}
              cloudConfig={cloudConfig}
              onSaveCloudConfig={(cfg) => {
                setCloudConfig(cfg);
                showToast(cfg.enabled ? 'Bulutli sinxronizatsiya saqlandi!' : 'Lokal rejim faollashtirildi.', 'success');
              }}
              onSyncNow={async () => {
                const res = await syncAllFromCloud(cloudConfig);
                if (res) {
                  showToast(`Bulutdan ${res.usersCount} ta foydalanuvchi va ${res.attemptsCount} ta natija sinxronlandi!`, 'success');
                } else {
                  showToast('Bulutli bazaga ulanib bo‘lmadi. URL va Anon Key ni tekshiring.', 'error');
                }
              }}
              onAddUser={(u) => {
                setUsers((prev) => [...prev, u]);
                if (cloudConfig.enabled) pushUserToCloud(cloudConfig, u);
                showToast(`${u.fullName} uchun hisob yaratildi!`);
              }}
              onDeleteUser={(id) => {
                setUsers((prev) => prev.filter((u) => u.id !== id));
                if (cloudConfig.enabled) deleteUserFromCloud(cloudConfig, id);
                showToast('Foydalanuvchi o‘chirildi.', 'info');
              }}
              onResetPassword={(id, newPass) => {
                const updatedHash = simpleHash(newPass);
                setUsers((prev) =>
                  prev.map((u) => {
                    if (u.id !== id) return u;
                    const updated = { ...u, passwordHash: updatedHash };
                    if (cloudConfig.enabled) pushUserToCloud(cloudConfig, updated);
                    return updated;
                  })
                );
                showToast('Parol muvaffaqiyatli yangilandi!');
              }}
              onAddTopic={(t) => {
                setTopics((prev) => [...prev, t]);
                showToast('Yangi mavzu muvaffaqiyatli qo‘shildi!');
              }}
              onUpdateTopic={(updated) => {
                setTopics((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
                showToast('Mavzu ma’lumotlari yangilandi!');
              }}
              onAddQuestion={(q) => {
                setQuestions((prev) => [...prev, q]);
                showToast('Yangi test savoli qo‘shildi!');
              }}
              onUpdateQuestion={(updated) => {
                setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
                showToast('Savol va javob kaliti yangilandi!');
              }}
              onDeleteQuestion={(qId) => {
                setQuestions((prev) => prev.filter((q) => q.id !== qId));
                showToast('Savol o‘chirildi.', 'info');
              }}
              onImportQuestions={(imported) => {
                setQuestions((prev) => {
                  const existingIds = new Set(prev.map((x) => x.id));
                  const deduped = imported.map((item, i) => ({
                    ...item,
                    id: existingIds.has(item.id) ? `${item.id}-imp-${Date.now()}-${i}` : item.id
                  }));
                  return [...prev, ...deduped];
                });
                showToast(`${imported.length} ta savol JSON orqali import qilindi!`);
              }}
              onReviewDecision={handleMentorReviewDecision}
              onOpenAttempt={(attemptId) => setMentorViewingAttemptId(attemptId)}
              showToast={showToast}
            />
          )}
        </main>
      </div>
    );
  }

  // ==========================================================================
  // STUDENT DEDICATED PORTAL
  // ==========================================================================
  const myAttempts = attempts.filter((a) => a.studentId === currentUser.id);
  const bestAttemptByTopic: Record<string, Attempt> = {};
  for (const att of myAttempts) {
    if (att.isRetryMode) continue;
    const prev = bestAttemptByTopic[att.topicId];
    if (!prev || att.score > prev.score) bestAttemptByTopic[att.topicId] = att;
  }
  const completedTopicsCount = topics.filter((t) => {
    const b = bestAttemptByTopic[t.id];
    return b && b.percentage >= 60;
  }).length;

  // Count unique unresolved mistakes for the student
  const studentWrongQuestionIds = new Set<string>();
  const sortedMyAttempts = [...myAttempts].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  for (const att of sortedMyAttempts) {
    for (const r of att.results) {
      if (r.status === 'wrong' || r.status === 'unanswered') {
        studentWrongQuestionIds.add(r.questionId);
      } else if (r.status === 'correct') {
        studentWrongQuestionIds.delete(r.questionId);
      }
    }
  }

  const navigateStudent = (next: StudentPageView) => {
    setStudentView(next);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-900 font-sans flex flex-col">
      <header className="sticky top-0 z-40 bg-[#0F2547] text-white shadow-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigateStudent({ name: 'home' })}
            className="flex items-center gap-2.5 text-left shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-inner border border-white/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold tracking-tight text-base leading-tight">DRF ACADEMY</div>
              <div className="text-[11px] text-blue-200/80 leading-tight">O‘quvchi portali</div>
            </div>
          </button>

          <nav className="hidden lg:flex items-center gap-1">
            <NavBtn active={studentView.name === 'home'} onClick={() => navigateStudent({ name: 'home' })}>
              Bosh sahifa
            </NavBtn>
            <NavBtn
              active={studentView.name === 'topics' || studentView.name === 'topic_detail'}
              onClick={() => navigateStudent({ name: 'topics' })}
            >
              Mavzular ({topics.length})
            </NavBtn>
            <NavBtn active={studentView.name === 'final_exam_intro'} onClick={() => navigateStudent({ name: 'final_exam_intro' })}>
              Yakuniy imtihon
            </NavBtn>
            <NavBtn active={studentView.name === 'mistakes'} onClick={() => navigateStudent({ name: 'mistakes' })}>
              <span className="flex items-center gap-1.5">
                Xatolarim tahlili
                {studentWrongQuestionIds.size > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                    {studentWrongQuestionIds.size}
                  </span>
                )}
              </span>
            </NavBtn>
            <NavBtn active={studentView.name === 'history'} onClick={() => navigateStudent({ name: 'history' })}>
              Natijalarim
            </NavBtn>
          </nav>

          <div className="hidden md:flex items-center gap-2.5">
            <div className="px-3 py-1.5 rounded-xl bg-[#183563] border border-white/10 text-xs flex items-center gap-2">
              <span className="font-semibold text-white">{currentUser.fullName}</span>
              {currentUser.groupName && (
                <span className="px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-100 text-[10px]">{currentUser.groupName}</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/30 text-xs font-semibold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Chiqish</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition"
            aria-label="Menyu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#132B52] border-t border-white/10 px-4 py-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <NavBtn active={studentView.name === 'home'} onClick={() => navigateStudent({ name: 'home' })}>Bosh sahifa</NavBtn>
              <NavBtn active={studentView.name === 'topics' || studentView.name === 'topic_detail'} onClick={() => navigateStudent({ name: 'topics' })}>Mavzular</NavBtn>
              <NavBtn active={studentView.name === 'final_exam_intro'} onClick={() => navigateStudent({ name: 'final_exam_intro' })}>Yakuniy imtihon</NavBtn>
              <NavBtn active={studentView.name === 'mistakes'} onClick={() => navigateStudent({ name: 'mistakes' })}>
                Xatolarim ({studentWrongQuestionIds.size})
              </NavBtn>
              <NavBtn active={studentView.name === 'history'} onClick={() => navigateStudent({ name: 'history' })}>Natijalarim</NavBtn>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <span>{currentUser.fullName} ({currentUser.groupName || 'O‘quvchi'})</span>
              <button type="button" onClick={handleLogout} className="px-3 py-1 rounded-lg bg-rose-500/30 text-white font-semibold">
                Chiqish
              </button>
            </div>
          </div>
        )}
      </header>

      {toast && <ToastBanner toast={toast} />}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {studentView.name === 'home' && (
          <HomeView
            topics={topics}
            questions={questions}
            attempts={myAttempts}
            bestAttemptByTopic={bestAttemptByTopic}
            completedTopicsCount={completedTopicsCount}
            studentName={currentUser.fullName}
            mistakeCount={studentWrongQuestionIds.size}
            onOpenTopic={(topicId) => navigateStudent({ name: 'topic_detail', topicId })}
            onOpenFinalExam={() => navigateStudent({ name: 'final_exam_intro' })}
            onOpenMistakes={() => navigateStudent({ name: 'mistakes' })}
            onOpenHistory={() => navigateStudent({ name: 'history' })}
          />
        )}

        {studentView.name === 'topics' && (
          <TopicsDirectoryView
            topics={topics}
            questions={questions}
            bestAttemptByTopic={bestAttemptByTopic}
            onOpenTopic={(topicId) => navigateStudent({ name: 'topic_detail', topicId })}
          />
        )}

        {studentView.name === 'topic_detail' && (
          <TopicDetailView
            topic={topics.find((t) => t.id === studentView.topicId) || topics[0]}
            topicQuestions={questions.filter((q) => q.topicId === studentView.topicId)}
            topicAttempts={myAttempts.filter((a) => a.topicId === studentView.topicId)}
            onBack={() => navigateStudent({ name: 'topics' })}
            onStartTest={() => navigateStudent({ name: 'quiz', topicId: studentView.topicId })}
            onOpenAttempt={(attemptId) => navigateStudent({ name: 'results', attemptId })}
          />
        )}

        {studentView.name === 'final_exam_intro' && (
          <FinalExamIntroView
            topics={topics}
            examQuestions={questions.filter((q) => q.topicId === 'final-exam')}
            examAttempts={myAttempts.filter((a) => a.topicId === 'final-exam')}
            completedTopicsCount={completedTopicsCount}
            onStartExam={() => navigateStudent({ name: 'quiz', topicId: 'final-exam' })}
            onOpenAttempt={(attemptId) => navigateStudent({ name: 'results', attemptId })}
          />
        )}

        {studentView.name === 'quiz' && (
          <QuizRunnerView
            topicId={studentView.topicId}
            topicTitle={
              studentView.topicId === 'final-exam'
                ? 'Umumiy Yakuniy Imtihon (9 ta mavzu)'
                : topics.find((t) => t.id === studentView.topicId)?.title || 'Test'
            }
            quizQuestions={studentView.customQuestions || questions.filter((q) => q.topicId === studentView.topicId)}
            student={currentUser}
            isRetry={Boolean(studentView.isRetry)}
            onFinish={handleFinishQuiz}
            onCancel={() =>
              studentView.topicId === 'final-exam'
                ? navigateStudent({ name: 'final_exam_intro' })
                : navigateStudent({ name: 'topic_detail', topicId: studentView.topicId })
            }
          />
        )}

        {studentView.name === 'results' && (
          <ResultsAndAnalysisView
            attempt={myAttempts.find((a) => a.id === studentView.attemptId)}
            allQuestions={questions}
            onRetryWrong={(wrongQs, topicId) =>
              navigateStudent({ name: 'quiz', topicId, customQuestions: wrongQs, isRetry: true })
            }
            onRetakeFull={(topicId) => navigateStudent({ name: 'quiz', topicId })}
            onBackHome={() => navigateStudent({ name: 'home' })}
          />
        )}

        {studentView.name === 'mistakes' && (
          <StudentMistakesHubView
            attempts={myAttempts}
            topics={topics}
            allQuestions={questions}
            unresolvedIds={studentWrongQuestionIds}
            onRetryMistakes={(qs) =>
              navigateStudent({ name: 'quiz', topicId: qs[0]?.topicId || 'topic-1', customQuestions: qs, isRetry: true })
            }
            onGoTopics={() => navigateStudent({ name: 'topics' })}
          />
        )}

        {studentView.name === 'history' && (
          <HistoryView
            attempts={myAttempts}
            onOpenAttempt={(attemptId) => navigateStudent({ name: 'results', attemptId })}
            onGoTopics={() => navigateStudent({ name: 'topics' })}
          />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#0F2547]">DRF ACADEMY</span>
            <span>•</span>
            <span>O‘quvchi shaxsiy kabineti</span>
          </div>
          <div>
            {cloudConfig.enabled ? 'Bulutli sinxronizatsiya faol (Supabase)' : 'Lokal saqlash (Hostingda Supabase ulash mumkin)'}
          </div>
        </div>
      </footer>
    </div>
  );
}

const ToastBanner: React.FC<{ toast: { type: 'success' | 'error' | 'info'; message: string } }> = ({ toast }) => (
  <div className="fixed bottom-5 right-5 z-50 max-w-sm">
    <div
      className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2.5 ${
        toast.type === 'success'
          ? 'bg-emerald-600 text-white border-emerald-500'
          : toast.type === 'error'
          ? 'bg-rose-600 text-white border-rose-500'
          : 'bg-[#0F2547] text-white border-blue-400/40'
      }`}
    >
      {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
      {toast.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
      {toast.type === 'info' && <Sparkles className="w-4 h-4 shrink-0" />}
      <span>{toast.message}</span>
    </div>
  </div>
);

const NavBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
      active
        ? 'bg-white/15 text-white shadow-sm'
        : 'text-blue-100/85 hover:text-white hover:bg-white/10'
    }`}
  >
    {children}
  </button>
);

// ============================================================================
// AUTH PORTAL (Alohida O‘quvchi kirishi va Alohida Mentor kirishi)
// ============================================================================
const AuthPortalView: React.FC<{
  users: UserAccount[];
  totalQuestions: number;
  totalTopics: number;
  onLogin: (user: UserAccount) => void;
  onRegisterStudent: (fullName: string, username: string, password: string, groupName: string) => string | null;
}> = ({ users, totalQuestions, totalTopics, onLogin, onRegisterStudent }) => {
  const [portalTab, setPortalTab] = useState<'student_login' | 'student_register' | 'mentor_login'>('student_login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [groupName, setGroupName] = useState('DRF-2026-A');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (portalTab === 'student_register') {
      const err = onRegisterStudent(fullName, username, password, groupName);
      if (err) setError(err);
      return;
    }

    const expectedRole: UserRole = portalTab === 'mentor_login' ? 'mentor' : 'student';
    const found = users.find(
      (u) =>
        u.role === expectedRole &&
        u.username.toLowerCase() === username.trim().toLowerCase() &&
        u.passwordHash === simpleHash(password)
    );
    if (!found) {
      setError(
        expectedRole === 'mentor'
          ? 'Mentor logini yoki paroli noto‘g‘ri.'
          : 'O‘quvchi logini yoki paroli noto‘g‘ri.'
      );
      return;
    }
    onLogin(found);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1D3A] via-[#0F2547] to-[#1A3B70] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Branding Panel */}
        <div className="lg:col-span-6 text-white p-6 sm:p-8 flex flex-col justify-between rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg border border-white/20">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-extrabold tracking-tight">DRF ACADEMY</div>
                <div className="text-xs text-blue-200">Django REST Framework Imtihon Platformasi</div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold leading-snug pt-2">
              O‘quvchilar va mentorlar uchun alohida parolli himoyalangan tizim
            </h1>
            <p className="text-sm text-blue-100/85 leading-relaxed">
              Har bir o‘quvchi o‘z shaxsiy login va paroli bilan kirib {totalTopics} ta mavzu hamda yakuniy imtihonni ishlaydi, xatolarini tahlil qiladi. Mentor esa alohida panelda barcha o‘quvchilar natijalarini tahlil qiladi.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/10 border border-white/10 p-3.5">
              <div className="text-2xl font-bold">{totalTopics}</div>
              <div className="text-xs text-blue-200 mt-0.5">Asosiy mavzu</div>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/10 p-3.5">
              <div className="text-2xl font-bold">{totalQuestions}</div>
              <div className="text-xs text-blue-200 mt-0.5">Test savoli</div>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/10 p-3.5">
              <div className="text-2xl font-bold">60%</div>
              <div className="text-xs text-blue-200 mt-0.5">O‘tish bali</div>
            </div>
          </div>

        </div>

        {/* Right Login/Register Card */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-center space-y-6">
          {/* Portal Switch Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100">
            <button
              type="button"
              onClick={() => { setPortalTab('student_login'); setError(null); }}
              className={`py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${
                portalTab !== 'mentor_login'
                  ? 'bg-[#0F2547] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>O‘quvchi kirishi</span>
            </button>
            <button
              type="button"
              onClick={() => { setPortalTab('mentor_login'); setError(null); }}
              className={`py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${
                portalTab === 'mentor_login'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Mentor kirishi</span>
            </button>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#0F2547]">
              {portalTab === 'mentor_login'
                ? 'Mentor boshqaruv paneliga kirish'
                : portalTab === 'student_register'
                ? 'Yangi o‘quvchi sifatida ro‘yxatdan o‘tish'
                : 'O‘quvchi shaxsiy kabinetiga kirish'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {portalTab === 'mentor_login'
                ? 'Faqat mentor login va paroli bilan tahlil va boshqaruv bo‘limiga kiriladi.'
                : 'O‘z login va parolingizni kiriting — barcha test natijalaringiz shaxsiy hisobingizda saqlanadi.'}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {portalTab === 'student_register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">To‘liq ism-familiya</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masalan: Sardorbek Aliyev"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Guruh nomi</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Masalan: DRF-2026-A"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Login (username)</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Loginingizni kiriting"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Parol</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold text-sm text-white transition shadow-sm flex items-center justify-center gap-2 ${
                portalTab === 'mentor_login'
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-[#0F2547] hover:bg-[#193A6E]'
              }`}
            >
              <span>
                {portalTab === 'student_register'
                  ? 'Ro‘yxatdan o‘tish va kirish'
                  : portalTab === 'mentor_login'
                  ? 'Mentor sifatida kirish'
                  : 'O‘quvchi sifatida kirish'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {portalTab !== 'mentor_login' && (
            <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
              {portalTab === 'student_login' ? (
                <>
                  Hisobingiz yo‘qmi?{' '}
                  <button
                    type="button"
                    onClick={() => { setPortalTab('student_register'); setError(null); }}
                    className="font-bold text-blue-700 hover:underline"
                  >
                    Yangi o‘quvchi sifatida ro‘yxatdan o‘ting
                  </button>
                </>
              ) : (
                <>
                  Allaqachon hisobingiz bormi?{' '}
                  <button
                    type="button"
                    onClick={() => { setPortalTab('student_login'); setError(null); }}
                    className="font-bold text-blue-700 hover:underline"
                  >
                    Tizimga kirish
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// STUDENT MISTAKES HUB (O‘quvchi uchun barcha xato savollarini tahlil qilish sahifasi)
// ============================================================================
const StudentMistakesHubView: React.FC<{
  attempts: Attempt[];
  topics: Topic[];
  allQuestions: Question[];
  unresolvedIds: Set<string>;
  onRetryMistakes: (qs: Question[]) => void;
  onGoTopics: () => void;
}> = ({ attempts, topics, allQuestions, unresolvedIds, onRetryMistakes, onGoTopics }) => {
  const [topicFilter, setTopicFilter] = useState('all');

  const qMap = useMemo(() => {
    const m: Record<string, Question> = {};
    for (const q of allQuestions) m[q.id] = q;
    return m;
  }, [allQuestions]);

  // Gather latest wrong answer info for each unresolved question
  const mistakeEntries = useMemo(() => {
    const latestWrongByQ: Record<string, { question: Question; lastAnswer: string; topicTitle: string; wrongCount: number }> = {};
    for (const att of attempts) {
      for (const r of att.results) {
        if (r.status === 'wrong' || r.status === 'unanswered') {
          const q = qMap[r.questionId];
          if (!q || !unresolvedIds.has(q.id)) continue;
          if (!latestWrongByQ[q.id]) {
            latestWrongByQ[q.id] = {
              question: q,
              lastAnswer: r.userAnswer,
              topicTitle: att.topicTitle,
              wrongCount: 1
            };
          } else {
            latestWrongByQ[q.id].wrongCount += 1;
          }
        }
      }
    }
    return Object.values(latestWrongByQ).filter((item) =>
      topicFilter === 'all' ? true : item.question.topicId === topicFilter
    );
  }, [attempts, qMap, unresolvedIds, topicFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2547]">Xatolarim tahlili</h1>
          <p className="text-sm text-slate-500">
            Barcha mavzular bo‘yicha xato yoki javobsiz qolgan savollaringiz — tushuntirishlarni o‘qing va qayta ishlab mustahkamlang.
          </p>
        </div>
        {mistakeEntries.length > 0 && (
          <button
            type="button"
            onClick={() => onRetryMistakes(mistakeEntries.map((m) => m.question))}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-sm shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Xato savollarni qayta ishlash ({mistakeEntries.length} ta)</span>
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm"
        >
          <option value="all">Barcha mavzular bo‘yicha ({unresolvedIds.size})</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.order}-mavzu: {t.shortTitle}</option>
          ))}
          <option value="final-exam">Yakuniy imtihon</option>
        </select>
      </div>

      {mistakeEntries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Tuzatilmagan xatolar yo‘q!</h2>
          <p className="text-sm text-slate-500">
            Testlarda xato qilingan savollar avtomatik shu yerda jamlanadi. To‘g‘ri qayta ishlaganingizda ro‘yxatdan chiqariladi.
          </p>
          <button
            type="button"
            onClick={onGoTopics}
            className="px-5 py-2.5 rounded-xl bg-[#0F2547] text-white text-sm font-semibold"
          >
            Mavzularga o‘tish
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {mistakeEntries.map((entry, idx) => {
            const q = entry.question;
            const correctDisplay =
              q.type === 'mcq' && q.options && q.correctOption
                ? `${q.correctOption}) ${q.options[q.correctOption]}`
                : (q.acceptedAnswers || [])[0] || '—';
            const userDisplay = !entry.lastAnswer
              ? 'Javob berilmagan'
              : q.type === 'mcq' && q.options
              ? `${entry.lastAnswer}) ${q.options[entry.lastAnswer as 'A' | 'B' | 'C' | 'D'] || ''}`
              : entry.lastAnswer;

            return (
              <div key={q.id} className="bg-white rounded-2xl border border-rose-200 p-5 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">
                      Xato #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-blue-700">{entry.topicTitle}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs">
                      {CATEGORY_META[q.category]}
                    </span>
                  </div>
                  <span className="text-xs text-rose-600 font-semibold">
                    {entry.wrongCount} marta xato qilingan
                  </span>
                </div>

                <p className="font-bold text-slate-900 text-sm sm:text-base">{q.text}</p>
                {q.code && <CodeBlock code={q.code} />}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200">
                    <div className="text-[11px] font-bold uppercase text-rose-500">Oxirgi javobingiz</div>
                    <div className="mt-1 font-medium text-rose-800">{userDisplay}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                    <div className="text-[11px] font-bold uppercase text-emerald-600">To‘g‘ri javob</div>
                    <div className="mt-1 font-medium text-emerald-800">{correctDisplay}</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-1.5">
                  <div>
                    <strong className="text-[#0F2547]">Tushuntirish: </strong>
                    {q.explanation}
                  </div>
                  {q.codeExplanation && (
                    <div className="pt-1 border-t border-slate-200/70">
                      <strong className="text-indigo-700">Kod izohi: </strong>
                      {q.codeExplanation}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 1. HOME VIEW (STUDENT)
// ============================================================================
const HomeView: React.FC<{
  topics: Topic[];
  questions: Question[];
  attempts: Attempt[];
  bestAttemptByTopic: Record<string, Attempt>;
  completedTopicsCount: number;
  studentName: string;
  mistakeCount: number;
  onOpenTopic: (topicId: string) => void;
  onOpenFinalExam: () => void;
  onOpenMistakes: () => void;
  onOpenHistory: () => void;
}> = ({
  topics,
  questions,
  attempts,
  bestAttemptByTopic,
  completedTopicsCount,
  studentName,
  mistakeCount,
  onOpenTopic,
  onOpenFinalExam,
  onOpenMistakes,
  onOpenHistory
}) => {
  const overallProgress = topics.length > 0 ? Math.round((completedTopicsCount / topics.length) * 100) : 0;
  const avgScore = useMemo(() => {
    const regular = attempts.filter((a) => !a.isRetryMode);
    if (regular.length === 0) return 0;
    return Math.round(regular.reduce((s, a) => s + a.percentage, 0) / regular.length);
  }, [attempts]);

  const finalBest = bestAttemptByTopic['final-exam'];

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-[#0F2547] via-[#153466] to-[#1E4687] text-white p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Choraklik nazorat imtihoniga tayyorgarlik</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
              Xush kelibsiz, {studentName}! Django REST Framework bilimlaringizni sinab ko‘ring.
            </h1>
            <p className="text-sm sm:text-base text-blue-100/90 max-w-2xl leading-relaxed">
              9 ta asosiy mavzuning har birida 30 tadan professional savol, 30 daqiqalik taymer, xatolar tahlili va faqat xato savollarni qayta ishlash imkoniyati. O‘tish chegarasi — 18/30 (60%).
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => onOpenTopic(topics[0]?.id || 'topic-1')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#0F2547] font-semibold text-sm hover:bg-blue-50 transition shadow-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>1-mavzudan boshlash</span>
              </button>
              <button
                type="button"
                onClick={onOpenFinalExam}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/25 hover:bg-blue-500/35 border border-white/25 text-white font-semibold text-sm transition"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>Umumiy yakuniy imtihon</span>
              </button>
              {mistakeCount > 0 && (
                <button
                  type="button"
                  onClick={onOpenMistakes}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/25 hover:bg-rose-500/35 border border-rose-300/30 text-white font-semibold text-sm transition"
                >
                  <RotateCcw className="w-4 h-4 text-rose-200" />
                  <span>Xatolarim ({mistakeCount})</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-100 uppercase tracking-wider">Umumiy tayyorgarlik</span>
              <span className="text-xl font-bold text-white">{overallProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-white/10 rounded-xl p-2.5">
                <div className="text-lg font-bold">{completedTopicsCount}/{topics.length}</div>
                <div className="text-[11px] text-blue-200">O‘tilgan</div>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5">
                <div className="text-lg font-bold">{avgScore}%</div>
                <div className="text-[11px] text-blue-200">O‘rtacha</div>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5">
                <div className="text-lg font-bold">{mistakeCount}</div>
                <div className="text-[11px] text-blue-200">Xatolar</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#0F2547] text-amber-300 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-[#0F2547]">Umumiy Yakuniy Imtihon</h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                9 ta mavzudan 30 ta noyob savol
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Oldingi mavzu testlarining nusxasi bo‘lmagan 25 ta variantli va 5 ta yopiq savol • 30 daqiqa • 60% o‘tish chegarasi.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
          {finalBest && (
            <div className="text-right">
              <div className="text-xs text-slate-500">Eng yuqori natija</div>
              <div className={`text-sm font-bold ${finalBest.percentage >= 60 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {finalBest.score}/{finalBest.totalQuestions} ({finalBest.percentage}%)
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onOpenFinalExam}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F2547] text-white text-sm font-semibold hover:bg-[#193A6E] transition"
          >
            <span>Imtihonga o‘tish</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0F2547]">O‘quv dasturi — {topics.length} ta asosiy mavzu</h2>
            <p className="text-sm text-slate-500">Har bir mavzu alohida sahifada, 30 ta muvozanatli test bilan taqdim etiladi.</p>
          </div>
          {attempts.length > 0 && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="text-sm font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
            >
              <span>Barcha natijalar</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {topics.map((topic) => {
            const qCount = questions.filter((q) => q.topicId === topic.id).length;
            const best = bestAttemptByTopic[topic.id];
            const passed = best && best.percentage >= 60;
            return (
              <div
                key={topic.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-[#0F2547]/10 text-[#0F2547] text-xs font-bold">
                      {topic.order}-MAVZU
                    </span>
                    {best ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          passed
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {best.score}/{best.totalQuestions} ({best.percentage}%)
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Ishlanmagan</span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {topic.title.replace(/^\d+-MAVZU\.\s*/, '')}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{topic.description}</p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {topic.technologies.slice(0, 3).map((tech, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium truncate max-w-[170px]">
                        {tech}
                      </span>
                    ))}
                    {topic.technologies.length > 3 && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium">
                        +{topic.technologies.length - 3} ta
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      {qCount} savol
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      30 daq
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenTopic(topic.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F2547] text-white text-xs font-semibold hover:bg-[#1A3B70] transition"
                  >
                    <span>Sahifani ochish</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

// ============================================================================
// 2. TOPICS DIRECTORY VIEW
// ============================================================================
const TopicsDirectoryView: React.FC<{
  topics: Topic[];
  questions: Question[];
  bestAttemptByTopic: Record<string, Attempt>;
  onOpenTopic: (topicId: string) => void;
}> = ({ topics, questions, bestAttemptByTopic, onOpenTopic }) => {
  const [query, setQuery] = useState('');
  const filtered = topics.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.technologies.some((tech) => tech.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2547]">Barcha mavzular</h1>
          <p className="text-sm text-slate-500">Har bir mavzu alohida sahifada o‘rganiladi va baholanadi.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mavzu yoki texnologiya qidirish..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((topic) => {
          const qs = questions.filter((q) => q.topicId === topic.id);
          const mcqCount = qs.filter((q) => q.type === 'mcq').length;
          const openCount = qs.filter((q) => q.type === 'open').length;
          const best = bestAttemptByTopic[topic.id];
          return (
            <div
              key={topic.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:border-blue-300 transition flex flex-col lg:flex-row lg:items-center justify-between gap-5"
            >
              <div className="space-y-2.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#0F2547] text-white text-xs font-bold">
                    {topic.order}-MAVZU
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {mcqCount} variantli • {openCount} yopiq • 30 daqiqa
                  </span>
                  {best && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        best.percentage >= 60 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      Eng yuqori: {best.score}/{best.totalQuestions} ({best.percentage}%)
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-900">{topic.title}</h2>
                <p className="text-sm text-slate-600">{topic.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {topic.technologies.map((tech, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenTopic(topic.id)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0F2547] text-white text-sm font-semibold hover:bg-[#193A6E] transition shrink-0"
              >
                <span>Mavzu sahifasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 3. TOPIC DETAIL PAGE
// ============================================================================
const TopicDetailView: React.FC<{
  topic: Topic;
  topicQuestions: Question[];
  topicAttempts: Attempt[];
  onBack: () => void;
  onStartTest: () => void;
  onOpenAttempt: (attemptId: string) => void;
}> = ({ topic, topicQuestions, topicAttempts, onBack, onStartTest, onOpenAttempt }) => {
  const stats = useMemo(() => {
    const mcq = topicQuestions.filter((q) => q.type === 'mcq').length;
    const open = topicQuestions.filter((q) => q.type === 'open').length;
    const easy = topicQuestions.filter((q) => q.difficulty === 'easy').length;
    const medium = topicQuestions.filter((q) => q.difficulty === 'medium').length;
    const hard = topicQuestions.filter((q) => q.difficulty === 'hard').length;
    const withCode = topicQuestions.filter((q) => Boolean(q.code)).length;
    return { mcq, open, easy, medium, hard, withCode };
  }, [topicQuestions]);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0F2547]"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Barcha mavzularga qaytish</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0F2547] text-white text-xs font-bold">
              <Layers className="w-3.5 h-3.5" />
              <span>{topic.order}-MAVZU SAHIFASI</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0F2547] leading-snug">{topic.title}</h1>
            <p className="text-sm text-slate-600 leading-relaxed">{topic.description}</p>

            <div className="pt-2">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                O‘rganiladigan texnologiyalar va mavzular
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {topic.technologies.map((tech, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700 font-medium">{tech}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {topicAttempts.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-[#0F2547]">Ushbu mavzu bo‘yicha urinishlaringiz</h2>
              <div className="divide-y divide-slate-100">
                {topicAttempts.map((att) => {
                  const grade = getGradeInfo(att.score, att.totalQuestions);
                  return (
                    <div key={att.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <span>{att.score}/{att.totalQuestions} ball ({att.percentage}%)</span>
                          {att.isRetryMode && (
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[11px]">Xatolarni qayta ishlash</span>
                          )}
                          {att.isProvisional && (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px]">Vaqtinchalik</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{formatDate(att.completedAt)} • {grade.label}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenAttempt(att.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-[#0F2547] hover:bg-slate-50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Tahlilni ko‘rish</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 sticky top-20">
            <h2 className="text-lg font-bold text-[#0F2547]">Test parametrlari</h2>
            <div className="space-y-2.5 text-sm">
              <ParamRow label="Jami savollar" value={`${topicQuestions.length} ta (${topicQuestions.length} ball)`} />
              <ParamRow label="Variantli (A, B, C, D)" value={`${stats.mcq} ta`} />
              <ParamRow label="Yopiq (mustaqil javob)" value={`${stats.open} ta`} />
              <ParamRow label="Kodli savollar" value={`${stats.withCode} ta`} />
              <ParamRow label="Qiyinlik taqsimoti" value={`${stats.easy} oson • ${stats.medium} o‘rta • ${stats.hard} murakkab`} />
              <ParamRow label="Ajratilgan vaqt" value="30 daqiqa" />
              <ParamRow label="O‘tish chegarasi" value="18 ball (60%)" />
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/80 text-xs text-blue-900 leading-relaxed">
              Test davomida javoblar to‘g‘ri yoki noto‘g‘riligi ko‘rsatilmaydi. Barcha natijalar va xatolar tahlili test yakunlangach ochiladi.
            </div>

            <button
              type="button"
              onClick={onStartTest}
              disabled={topicQuestions.length === 0}
              className="w-full py-3 rounded-xl bg-[#0F2547] hover:bg-[#193A6E] disabled:opacity-50 text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Testni boshlash (30 daqiqa)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ParamRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 gap-2">
    <span className="text-slate-500">{label}</span>
    <span className="font-semibold text-slate-900 text-right">{value}</span>
  </div>
);

// ============================================================================
// 4. FINAL EXAM INTRO VIEW
// ============================================================================
const FinalExamIntroView: React.FC<{
  topics: Topic[];
  examQuestions: Question[];
  examAttempts: Attempt[];
  completedTopicsCount: number;
  onStartExam: () => void;
  onOpenAttempt: (attemptId: string) => void;
}> = ({ topics, examQuestions, examAttempts, completedTopicsCount, onStartExam, onOpenAttempt }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-[#0F2547] to-[#1D3E78] text-white p-6 sm:p-8 shadow-lg space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-semibold">
          <Award className="w-4 h-4" />
          <span>CHORAKLIK NAZORAT — UMUMIY YAKUNIY IMTIHON</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">Django REST Framework Yakuniy Imtihoni</h1>
        <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed">
          Ushbu imtihon 9 ta mavzuning barchasini qamrab oladi. Savollar mavzu testlarining nusxasi emas — ular alohida tuzilgan 30 ta noyob imtihon savollaridir (25 ta variantli + 5 ta yopiq).
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-xs text-blue-200">Savollar soni</div>
            <div className="text-xl font-bold mt-0.5">{examQuestions.length} ta</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-xs text-blue-200">Vaqt chegarasi</div>
            <div className="text-xl font-bold mt-0.5">30 daqiqa</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-xs text-blue-200">O‘tish bali</div>
            <div className="text-xl font-bold mt-0.5">18 / 30 (60%)</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-xs text-blue-200">O‘tilgan mavzular</div>
            <div className="text-xl font-bold mt-0.5">{completedTopicsCount} / {topics.length}</div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onStartExam}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0F2547] font-bold text-sm transition shadow-md"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Yakuniy imtihonni boshlash</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#0F2547]">Baholash mezonlari</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
            <div className="text-sm font-bold text-rose-700">0 – 17 ball</div>
            <div className="text-xs text-rose-600 mt-1">Talabga javob bermadi</div>
          </div>
          <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200">
            <div className="text-sm font-bold text-teal-700">18 – 22 ball</div>
            <div className="text-xs text-teal-600 mt-1">O‘tish chegarasidan muvaffaqiyatli o‘tdi</div>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
            <div className="text-sm font-bold text-blue-700">23 – 26 ball</div>
            <div className="text-xs text-blue-600 mt-1">Yaxshi</div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="text-sm font-bold text-emerald-700">27 – 30 ball</div>
            <div className="text-xs text-emerald-600 mt-1">A'lo</div>
          </div>
        </div>
      </div>

      {examAttempts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-[#0F2547]">Yakuniy imtihon natijalaringiz</h2>
          <div className="divide-y divide-slate-100">
            {examAttempts.map((att) => (
              <div key={att.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {att.score}/{att.totalQuestions} ball ({att.percentage}%)
                  </div>
                  <div className="text-xs text-slate-500">{formatDate(att.completedAt)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenAttempt(att.id)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-[#0F2547] hover:bg-slate-50"
                >
                  Tahlilni ko‘rish
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 5. QUIZ RUNNER INTERFACE
// ============================================================================
const QuizRunnerView: React.FC<{
  topicId: string;
  topicTitle: string;
  quizQuestions: Question[];
  student: UserAccount;
  isRetry: boolean;
  onFinish: (attempt: Attempt) => void;
  onCancel: () => void;
}> = ({ topicId, topicTitle, quizQuestions, student, isRetry, onFinish, onCancel }) => {
  const TOTAL_SECONDS = isRetry ? Math.max(quizQuestions.length * 60, 300) : 30 * 60;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [confirmFinishOpen, setConfirmFinishOpen] = useState(false);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const startedAtRef = useRef(new Date().toISOString());
  const submittedRef = useRef(false);

  const submitQuiz = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const results: QuestionResult[] = quizQuestions.map((q) => {
      const userAns = (answers[q.id] || '').trim();
      if (q.type === 'mcq') {
        if (!userAns) return { questionId: q.id, userAnswer: '', status: 'unanswered', score: 0 };
        const isRight = userAns === q.correctOption;
        return { questionId: q.id, userAnswer: userAns, status: isRight ? 'correct' : 'wrong', score: isRight ? 1 : 0 };
      } else {
        const status = evaluateOpenAnswer(q, userAns);
        return { questionId: q.id, userAnswer: userAns, status, score: status === 'correct' ? 1 : 0 };
      }
    });

    const correctCount = results.filter((r) => r.status === 'correct').length;
    const wrongCount = results.filter((r) => r.status === 'wrong').length;
    const unansweredCount = results.filter((r) => r.status === 'unanswered').length;
    const pendingReviewCount = results.filter((r) => r.status === 'pending_review').length;
    const total = quizQuestions.length;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    const attempt: Attempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      studentId: student.id,
      studentName: student.fullName,
      studentGroup: student.groupName,
      topicId,
      topicTitle,
      startedAt: startedAtRef.current,
      completedAt: new Date().toISOString(),
      durationSeconds: TOTAL_SECONDS - secondsLeft,
      totalQuestions: total,
      score: correctCount,
      percentage,
      correctCount,
      wrongCount,
      unansweredCount,
      pendingReviewCount,
      isProvisional: pendingReviewCount > 0,
      isRetryMode: isRetry,
      results
    };
    onFinish(attempt);
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0 && !submittedRef.current) {
      submitQuiz();
    }
  }, [secondsLeft]);

  const currentQ = quizQuestions[currentIndex];
  const answeredCount = useMemo(
    () => quizQuestions.filter((q) => (answers[q.id] || '').trim().length > 0).length,
    [quizQuestions, answers]
  );
  const unansweredCount = quizQuestions.length - answeredCount;
  const progressPct = quizQuestions.length > 0 ? Math.round((answeredCount / quizQuestions.length) * 100) : 0;

  if (!currentQ) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
        <p className="text-slate-600">Savollar topilmadi.</p>
        <button type="button" onClick={onCancel} className="mt-4 px-4 py-2 bg-[#0F2547] text-white rounded-xl text-sm">
          Orqaga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmExitOpen(true)}
              className="text-xs font-semibold text-slate-500 hover:text-rose-600 inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Chiqish
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-semibold text-blue-700 truncate">
              {isRetry ? 'Xato savollarni qayta ishlash' : topicTitle}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-40 sm:w-56 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#0F2547] rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {answeredCount}/{quizQuestions.length} javob berildi
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-sm font-bold border ${
              secondsLeft <= 60
                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                : secondsLeft <= 300
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-50 text-[#0F2547] border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(secondsLeft)}</span>
          </div>
          <button
            type="button"
            onClick={() => setConfirmFinishOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition shadow-sm"
          >
            Testni yakunlash
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-[#0F2547] text-white text-xs font-bold">
                Savol {currentIndex + 1} / {quizQuestions.length}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${DIFFICULTY_META[currentQ.difficulty].badge}`}>
                {DIFFICULTY_META[currentQ.difficulty].label}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                {CATEGORY_META[currentQ.category]}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {currentQ.type === 'mcq' ? 'Variantli (1 ball)' : 'Yopiq savol (1 ball)'}
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">{currentQ.text}</h2>
          {currentQ.code && <CodeBlock code={currentQ.code} />}

          {currentQ.type === 'mcq' && currentQ.options && (
            <div className="space-y-2.5 pt-1">
              {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                const selected = answers[currentQ.id] === letter;
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: letter }))}
                    className={`w-full text-left p-4 rounded-xl border-2 transition flex items-start gap-3.5 ${
                      selected ? 'border-[#0F2547] bg-blue-50/70 shadow-sm' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${selected ? 'bg-[#0F2547] text-white' : 'bg-slate-100 text-slate-700'}`}>
                      {letter}
                    </span>
                    <span className="text-sm sm:text-[15px] text-slate-800 leading-snug pt-0.5">{currentQ.options![letter]}</span>
                  </button>
                );
              })}
            </div>
          )}

          {currentQ.type === 'open' && (
            <div className="space-y-2.5 pt-1">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Javobingizni kiriting:</label>
              {currentQ.requiresMentorReview ? (
                <textarea
                  rows={4}
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))}
                  placeholder="Javobingizni aniq va qisqa yozing..."
                  className="w-full p-3.5 rounded-xl border-2 border-slate-200 focus:border-[#0F2547] focus:outline-none text-sm text-slate-900"
                />
              ) : (
                <input
                  type="text"
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))}
                  placeholder="Aniq atama, sintaksis yoki kod qismini yozing..."
                  className="w-full p-3.5 rounded-xl border-2 border-slate-200 focus:border-[#0F2547] focus:outline-none text-sm font-mono text-slate-900"
                />
              )}
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                {currentQ.requiresMentorReview
                  ? 'Mazmunan baholanadigan savol: kalitga mos kelmasa mentor tekshiruviga yuboriladi.'
                  : 'Avtomatik tekshiriladigan aniq javob kalitiga ega savol.'}
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Oldingi savol</span>
            </button>

            {currentIndex < quizQuestions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.min(quizQuestions.length - 1, i + 1))}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0F2547] hover:bg-[#193A6E] text-white text-sm font-semibold transition"
              >
                <span>Keyingi savol</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmFinishOpen(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Testni yakunlash</span>
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F2547]">Savollar navigatsiyasi</h3>
            <span className="text-xs text-slate-500">{quizQuestions.length} ta savol</span>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {quizQuestions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = (answers[q.id] || '').trim().length > 0;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 rounded-lg text-xs font-bold transition border ${
                    isCurrent
                      ? 'bg-[#0F2547] text-white border-[#0F2547] ring-2 ring-blue-300'
                      : isAnswered
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400" />Javob berilgan</span>
              <span className="font-bold text-emerald-700">{answeredCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />Javob berilmagan</span>
              <span className="font-bold text-slate-700">{unansweredCount}</span>
            </div>
          </div>
        </div>
      </div>

      {confirmFinishOpen && (
        <Modal onClose={() => setConfirmFinishOpen(false)} title="Testni yakunlashni tasdiqlang">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Siz <strong>{answeredCount}</strong> ta savolga javob berdingiz.
              {unansweredCount > 0 ? (
                <span className="text-amber-700 font-medium"> Hali <strong>{unansweredCount}</strong> ta savol javobsiz qolgan.</span>
              ) : (
                <span className="text-emerald-700 font-medium"> Barcha savollarga javob belgilangan!</span>
              )}
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button type="button" onClick={() => setConfirmFinishOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700">
                Davom etish
              </button>
              <button type="button" onClick={submitQuiz} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">
                Ha, yakunlash
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmExitOpen && (
        <Modal onClose={() => setConfirmExitOpen(false)} title="Testdan chiqmoqchimisiz?">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Agar hozir chiqsangiz, joriy urinishdagi javoblaringiz saqlanmaydi.</p>
            <div className="flex justify-end gap-2.5">
              <button type="button" onClick={() => setConfirmExitOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700">Qolish</button>
              <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold">Chiqish</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ============================================================================
// 6. RESULTS & ERROR ANALYSIS VIEW
// ============================================================================
const ResultsAndAnalysisView: React.FC<{
  attempt?: Attempt;
  allQuestions: Question[];
  isMentorView?: boolean;
  onRetryWrong: (wrongQuestions: Question[], topicId: string) => void;
  onRetakeFull: (topicId: string) => void;
  onBackHome: () => void;
}> = ({ attempt, allQuestions, isMentorView = false, onRetryWrong, onRetakeFull, onBackHome }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'wrong' | 'correct' | 'pending_review'>('all');

  if (!attempt) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
        <p className="text-slate-600">Natija topilmadi.</p>
        <button type="button" onClick={onBackHome} className="mt-4 px-4 py-2 bg-[#0F2547] text-white rounded-xl text-sm">
          Orqaga qaytish
        </button>
      </div>
    );
  }

  const grade = getGradeInfo(attempt.score, attempt.totalQuestions);
  const questionMap = useMemo(() => {
    const m: Record<string, Question> = {};
    for (const q of allQuestions) m[q.id] = q;
    return m;
  }, [allQuestions]);

  const pieData = [
    { name: 'To‘g‘ri', value: attempt.correctCount, color: '#059669' },
    { name: 'Noto‘g‘ri', value: attempt.wrongCount, color: '#DC2626' },
    { name: 'Javobsiz', value: attempt.unansweredCount, color: '#94A3B8' },
    ...(attempt.pendingReviewCount > 0 ? [{ name: 'Mentor tekshiruvida', value: attempt.pendingReviewCount, color: '#D97706' }] : [])
  ].filter((d) => d.value > 0);

  const categoryChartData = useMemo(() => {
    const counts: Record<QuestionCategory, { name: string; correct: number; total: number }> = {
      theory: { name: 'Nazariya', correct: 0, total: 0 },
      terms: { name: 'Atamalar', correct: 0, total: 0 },
      code_analysis: { name: 'Kod tahlili', correct: 0, total: 0 },
      bug_finding: { name: 'Xato topish', correct: 0, total: 0 },
      practical: { name: 'Amaliy', correct: 0, total: 0 }
    };
    for (const r of attempt.results) {
      const q = questionMap[r.questionId];
      if (!q) continue;
      counts[q.category].total += 1;
      if (r.status === 'correct') counts[q.category].correct += 1;
    }
    return Object.values(counts)
      .filter((c) => c.total > 0)
      .map((c) => ({ name: c.name, foiz: Math.round((c.correct / c.total) * 100) }));
  }, [attempt, questionMap]);

  const wrongQuestions = useMemo(() => {
    return attempt.results
      .filter((r) => r.status === 'wrong' || r.status === 'unanswered')
      .map((r) => questionMap[r.questionId])
      .filter(Boolean);
  }, [attempt, questionMap]);

  const filteredResults = attempt.results.filter((r) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'wrong') return r.status === 'wrong' || r.status === 'unanswered';
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {attempt.isProvisional && (
        <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>Vaqtinchalik natija:</strong> {attempt.pendingReviewCount} ta yopiq savol mentor tekshiruvini kutmoqda.
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">{attempt.topicTitle}</div>
            <h1 className="text-2xl font-bold text-[#0F2547] mt-1">Test natijalari</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              O‘quvchi: {attempt.studentName} {attempt.studentGroup ? `(${attempt.studentGroup})` : ''} • {formatDate(attempt.completedAt)} • Vaqt: {formatTimer(attempt.durationSeconds)}
            </p>
          </div>
          <div className={`px-4 py-2.5 rounded-xl border font-bold text-sm ${grade.bgClass} ${grade.colorClass}`}>
            {grade.label}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Umumiy ball" value={`${attempt.score} / ${attempt.totalQuestions}`} accent="text-[#0F2547]" />
          <StatCard label="Foiz ko‘rsatkichi" value={`${attempt.percentage}%`} accent={grade.passed ? 'text-emerald-600' : 'text-rose-600'} />
          <StatCard label="To‘g‘ri javoblar" value={`${attempt.correctCount}`} accent="text-emerald-600" />
          <StatCard label="Noto‘g‘ri javoblar" value={`${attempt.wrongCount}`} accent="text-rose-600" />
          <StatCard label="Javobsiz" value={`${attempt.unansweredCount}`} accent="text-slate-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-4">
            <h3 className="text-sm font-bold text-[#0F2547] mb-2">Natijalar taqsimoti</h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3}>
                    {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-xs mt-1">
              {pieData.map((d, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}: {d.value}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-4">
            <h3 className="text-sm font-bold text-[#0F2547] mb-2">Yo‘nalishlar bo‘yicha o‘zlashtirish (%)</h3>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="foiz" fill="#1E40AF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {!isMentorView && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
            {wrongQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => onRetryWrong(wrongQuestions, attempt.topicId)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Faqat xato savollarni qayta ishlash ({wrongQuestions.length} ta)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onRetakeFull(attempt.topicId)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F2547] hover:bg-[#193A6E] text-white text-sm font-semibold transition"
            >
              <Play className="w-4 h-4" />
              <span>To‘liq testni qaytadan ishlash</span>
            </button>
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition"
            >
              <span>Bosh sahifaga qaytish</span>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#0F2547]">Xatolar tahlili va tushuntirishlar</h2>
            <p className="text-xs text-slate-500">Har bir savol bo‘yicha javob, to‘g‘ri kalit va texnik izoh.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {([
              ['all', `Barchasi (${attempt.results.length})`],
              ['wrong', `Xato/Javobsiz (${attempt.wrongCount + attempt.unansweredCount})`],
              ['correct', `To‘g‘ri (${attempt.correctCount})`],
              ...(attempt.pendingReviewCount > 0 ? [['pending_review', `Tekshiruvda (${attempt.pendingReviewCount})`]] : [])
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilterStatus(key as typeof filterStatus)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterStatus === key ? 'bg-[#0F2547] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredResults.map((res, idx) => {
            const q = questionMap[res.questionId];
            if (!q) return null;
            const correctDisplay =
              q.type === 'mcq' && q.options && q.correctOption
                ? `${q.correctOption}) ${q.options[q.correctOption]}`
                : (q.acceptedAnswers || [])[0] || '—';
            const userDisplay = !res.userAnswer
              ? 'Javob berilmagan'
              : q.type === 'mcq' && q.options
              ? `${res.userAnswer}) ${q.options[res.userAnswer as 'A' | 'B' | 'C' | 'D'] || ''}`
              : res.userAnswer;

            return (
              <div
                key={res.questionId}
                className={`rounded-xl border p-4 sm:p-5 space-y-3 ${
                  res.status === 'correct'
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : res.status === 'pending_review'
                    ? 'border-amber-200 bg-amber-50/40'
                    : 'border-rose-200 bg-rose-50/30'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0F2547]">#{idx + 1}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      {CATEGORY_META[q.category]}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      res.status === 'correct'
                        ? 'bg-emerald-100 text-emerald-800'
                        : res.status === 'pending_review'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {res.status === 'correct' && <><CheckCircle2 className="w-3.5 h-3.5" /> To‘g‘ri (+1)</>}
                    {res.status === 'wrong' && <><XCircle className="w-3.5 h-3.5" /> Noto‘g‘ri (0)</>}
                    {res.status === 'unanswered' && <><AlertTriangle className="w-3.5 h-3.5" /> Javobsiz (0)</>}
                    {res.status === 'pending_review' && <><Clock className="w-3.5 h-3.5" /> Mentor tekshiruvida</>}
                  </span>
                </div>

                <p className="text-sm sm:text-base font-semibold text-slate-900">{q.text}</p>
                {q.code && <CodeBlock code={q.code} />}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <div className="text-[11px] font-semibold uppercase text-slate-400">O‘quvchi javobi</div>
                    <div className={`mt-1 font-medium ${res.status === 'correct' ? 'text-emerald-700' : 'text-rose-700'}`}>{userDisplay}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <div className="text-[11px] font-semibold uppercase text-slate-400">To‘g‘ri javob</div>
                    <div className="mt-1 font-medium text-emerald-700">{correctDisplay}</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-white/90 border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-1.5">
                  <div><strong className="text-[#0F2547]">Tushuntirish: </strong>{q.explanation}</div>
                  {q.codeExplanation && (
                    <div className="pt-1 border-t border-slate-100">
                      <strong className="text-indigo-700">Kod izohi: </strong>{q.codeExplanation}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; accent: string }> = ({ label, value, accent }) => (
  <div className="rounded-xl bg-[#F8FAFC] border border-slate-200/80 p-3.5 text-center">
    <div className="text-xs text-slate-500">{label}</div>
    <div className={`text-xl font-bold mt-1 ${accent}`}>{value}</div>
  </div>
);

// ============================================================================
// 7. STUDENT HISTORY VIEW
// ============================================================================
const HistoryView: React.FC<{
  attempts: Attempt[];
  onOpenAttempt: (attemptId: string) => void;
  onGoTopics: () => void;
}> = ({ attempts, onOpenAttempt, onGoTopics }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F2547]">Natijalarim tarixi</h1>
        <p className="text-sm text-slate-500">Shaxsiy hisobingizdagi barcha yakunlangan testlar va yakuniy imtihonlar.</p>
      </div>

      {attempts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <BarChart3 className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-base font-bold text-slate-700">Hozircha natijalar mavjud emas</div>
          <p className="text-sm text-slate-500">Birinchi mavzu testini ishlang — barcha natijalar shu yerda saqlanadi.</p>
          <button type="button" onClick={onGoTopics} className="mt-2 px-5 py-2.5 rounded-xl bg-[#0F2547] text-white text-sm font-semibold">
            Mavzularga o‘tish
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Mavzu / Imtihon</th>
                  <th className="px-4 py-3">Ball</th>
                  <th className="px-4 py-3">Holat</th>
                  <th className="px-4 py-3">Sana</th>
                  <th className="px-4 py-3 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((att) => {
                  const grade = getGradeInfo(att.score, att.totalQuestions);
                  return (
                    <tr key={att.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {att.topicTitle}
                        {att.isRetryMode && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-indigo-50 text-indigo-700">Qayta ishlash</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#0F2547]">{att.score}/{att.totalQuestions} ({att.percentage}%)</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${grade.bgClass} ${grade.colorClass}`}>
                          {att.isProvisional ? 'Tekshiruvda' : grade.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(att.completedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenAttempt(att.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#0F2547]/5 hover:bg-[#0F2547] hover:text-white text-[#0F2547] text-xs font-semibold transition"
                        >
                          Tahlil
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 8. MENTOR PANEL VIEW (Analitika, O‘quvchilar boshqaruvi, Natijalar, Tekshiruv, CRUD, Bulut)
// ============================================================================
const MentorPanelView: React.FC<{
  topics: Topic[];
  questions: Question[];
  attempts: Attempt[];
  users: UserAccount[];
  cloudConfig: CloudConfig;
  onSaveCloudConfig: (cfg: CloudConfig) => void;
  onSyncNow: () => void;
  onAddUser: (u: UserAccount) => void;
  onDeleteUser: (id: string) => void;
  onResetPassword: (id: string, newPass: string) => void;
  onAddTopic: (t: Topic) => void;
  onUpdateTopic: (t: Topic) => void;
  onAddQuestion: (q: Question) => void;
  onUpdateQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onImportQuestions: (qs: Question[]) => void;
  onReviewDecision: (attemptId: string, questionId: string, isCorrect: boolean) => void;
  onOpenAttempt: (attemptId: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}> = ({
  topics,
  questions,
  attempts,
  users,
  cloudConfig,
  onSaveCloudConfig,
  onSyncNow,
  onAddUser,
  onDeleteUser,
  onResetPassword,
  onAddTopic,
  onUpdateTopic,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onImportQuestions,
  onReviewDecision,
  onOpenAttempt,
  showToast
}) => {
  const [tab, setTab] = useState<'analytics' | 'results' | 'reviews' | 'students' | 'topics' | 'questions' | 'cloud'>('analytics');
  const [onlyBelow60, setOnlyBelow60] = useState(false);
  const [resultTopicFilter, setResultTopicFilter] = useState('all');
  const [resultSearch, setResultSearch] = useState('');

  // Student management state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentLogin, setNewStudentLogin] = useState('');
  const [newStudentPass, setNewStudentPass] = useState('123456');
  const [newStudentGroup, setNewStudentGroup] = useState('DRF-2026-A');
  const [resetPassModal, setResetPassModal] = useState<{ user: UserAccount; pass: string } | null>(null);

  // Cloud config form
  const [sbUrl, setSbUrl] = useState(cloudConfig.supabaseUrl);
  const [sbKey, setSbKey] = useState(cloudConfig.supabaseAnonKey);
  const [sbEnabled, setSbEnabled] = useState(cloudConfig.enabled);

  // Topic & Question modals
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [qTopicFilter, setQTopicFilter] = useState<string>('topic-1');
  const [qSearch, setQSearch] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  const studentAccounts = useMemo(() => users.filter((u) => u.role === 'student'), [users]);

  const filteredAttempts = useMemo(() => {
    return attempts.filter((a) => {
      if (onlyBelow60 && a.percentage >= 60) return false;
      if (resultTopicFilter !== 'all' && a.topicId !== resultTopicFilter) return false;
      if (resultSearch.trim() && !a.studentName.toLowerCase().includes(resultSearch.toLowerCase())) return false;
      return true;
    });
  }, [attempts, onlyBelow60, resultTopicFilter, resultSearch]);

  const pendingItems = useMemo(() => {
    const items: Array<{ attempt: Attempt; result: QuestionResult; question: Question }> = [];
    const qMap: Record<string, Question> = {};
    for (const q of questions) qMap[q.id] = q;
    for (const att of attempts) {
      for (const r of att.results) {
        if (r.status === 'pending_review' && qMap[r.questionId]) {
          items.push({ attempt: att, result: r, question: qMap[r.questionId] });
        }
      }
    }
    return items;
  }, [attempts, questions]);

  // Deep Analytics Computations
  const topicAnalytics = useMemo(() => {
    return topics.map((t) => {
      const topicAtts = attempts.filter((a) => a.topicId === t.id && !a.isRetryMode);
      const avg = topicAtts.length > 0 ? Math.round(topicAtts.reduce((s, a) => s + a.percentage, 0) / topicAtts.length) : 0;
      const passRate = topicAtts.length > 0 ? Math.round((topicAtts.filter((a) => a.percentage >= 60).length / topicAtts.length) * 100) : 0;
      return { name: `${t.order}-mavzu`, title: t.shortTitle, ortacha: avg, otish: passRate, urinish: topicAtts.length };
    });
  }, [topics, attempts]);

  const mostMissedQuestions = useMemo(() => {
    const qMap: Record<string, Question> = {};
    for (const q of questions) qMap[q.id] = q;
    const stats: Record<string, { q: Question; wrong: number; total: number }> = {};
    for (const att of attempts) {
      for (const r of att.results) {
        const q = qMap[r.questionId];
        if (!q) continue;
        if (!stats[q.id]) stats[q.id] = { q, wrong: 0, total: 0 };
        stats[q.id].total += 1;
        if (r.status === 'wrong' || r.status === 'unanswered') stats[q.id].wrong += 1;
      }
    }
    return Object.values(stats)
      .filter((s) => s.wrong > 0)
      .sort((a, b) => b.wrong - a.wrong)
      .slice(0, 8);
  }, [attempts, questions]);

  const studentSummaries = useMemo(() => {
    return studentAccounts.map((st) => {
      const stAtts = attempts.filter((a) => a.studentId === st.id && !a.isRetryMode);
      const avg = stAtts.length > 0 ? Math.round(stAtts.reduce((s, a) => s + a.percentage, 0) / stAtts.length) : 0;
      const passedTopics = new Set(stAtts.filter((a) => a.percentage >= 60).map((a) => a.topicId)).size;
      const latest = stAtts[0];
      return { student: st, attemptsCount: stAtts.length, avg, passedTopics, latest };
    });
  }, [studentAccounts, attempts]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (qTopicFilter !== 'all' && q.topicId !== qTopicFilter) return false;
      if (qSearch.trim() && !q.text.toLowerCase().includes(qSearch.toLowerCase())) return false;
      return true;
    });
  }, [questions, qTopicFilter, qSearch]);

  const handleExportCSV = () => {
    const headers = ['Oquvchi', 'Guruh', 'Mavzu', 'Ball', 'Jami', 'Foiz', 'Holat', 'Sana'];
    const rows = filteredAttempts.map((a) => {
      const grade = getGradeInfo(a.score, a.totalQuestions);
      return [
        `"${a.studentName.replace(/"/g, '""')}"`,
        `"${(a.studentGroup || '').replace(/"/g, '""')}"`,
        `"${a.topicTitle.replace(/"/g, '""')}"`,
        a.score,
        a.totalQuestions,
        `${a.percentage}%`,
        `"${a.isProvisional ? 'Tekshiruvda' : grade.label}"`,
        `"${formatDate(a.completedAt)}"`
      ].join(',');
    });
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drf-academy-natijalar-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Natijalar CSV formatida yuklab olindi!');
  };

  const handleExportJSON = () => {
    const payload = { exportedAt: new Date().toISOString(), schemaVersion: '2.0', topics, questions, attempts, users: studentAccounts };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drf-academy-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Barcha ma’lumotlar JSON formatida eksport qilindi!');
  };

  const handleJSONImportSubmit = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const arr: Question[] = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(arr) || arr.length === 0) {
        showToast('JSON ichida savollar massivi topilmadi.', 'error');
        return;
      }
      const valid = arr.every((q) => q.text && q.topicId && q.type && q.difficulty && q.category && q.explanation);
      if (!valid) {
        showToast('Ba’zi savollarda majburiy maydonlar yetishmayapti.', 'error');
        return;
      }
      onImportQuestions(arr);
      setJsonInput('');
      setJsonModalOpen(false);
    } catch {
      showToast('JSON formati noto‘g‘ri! Sintaksisni tekshiring.', 'error');
    }
  };

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const login = newStudentLogin.trim().toLowerCase();
    if (!newStudentName.trim() || !login || newStudentPass.length < 4) {
      showToast('Ism, login va kamida 4 belgili parol kiriting.', 'error');
      return;
    }
    if (users.some((u) => u.username.toLowerCase() === login)) {
      showToast('Bu login band!', 'error');
      return;
    }
    onAddUser({
      id: `student-${Date.now()}`,
      fullName: newStudentName.trim(),
      username: login,
      passwordHash: simpleHash(newStudentPass),
      role: 'student',
      groupName: newStudentGroup.trim() || 'DRF-2026',
      createdAt: new Date().toISOString()
    });
    setNewStudentName('');
    setNewStudentLogin('');
    setNewStudentPass('123456');
  };

  const below60Count = attempts.filter((a) => a.percentage < 60).length;
  const overallAvg = attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2547]">Mentor tahlil va boshqaruv markazi</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            O‘quvchilar natijalarini tahlil qiling, hisoblar va savollarni boshqaring, masofaviy hosting uchun bulutli bazani ulang.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleExportCSV} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition">
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV eksport</span>
          </button>
          <button type="button" onClick={handleExportJSON} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F2547] hover:bg-[#193A6E] text-white text-xs font-semibold transition">
            <Download className="w-4 h-4" />
            <span>JSON zaxira</span>
          </button>
          <button type="button" onClick={() => setJsonModalOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition">
            <Upload className="w-4 h-4" />
            <span>JSON import</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="O‘quvchilar" value={`${studentAccounts.length} nafar`} accent="text-[#0F2547]" />
        <StatCard label="Jami urinishlar" value={`${attempts.length} ta`} accent="text-blue-700" />
        <StatCard label="O‘rtacha o‘zlashtirish" value={`${overallAvg}%`} accent="text-emerald-600" />
        <StatCard label="60% dan past" value={`${below60Count} ta`} accent="text-rose-600" />
        <StatCard label="Tekshiruvda" value={`${pendingItems.length} ta`} accent="text-amber-600" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2">
        {([
          ['analytics', 'Analitika'],
          ['results', `Natijalar (${attempts.length})`],
          ['reviews', `Tekshiruv (${pendingItems.length})`],
          ['students', `O‘quvchilar (${studentAccounts.length})`],
          ['topics', `Mavzular (${topics.length})`],
          ['questions', `Savollar (${questions.length})`],
          ['cloud', 'Hosting / Bulut']
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              tab === key ? 'bg-[#0F2547] text-white' : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: DEEP ANALYTICS */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-[#0F2547] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Mavzular bo‘yicha o‘rtacha natija (%)
                </h2>
                <span className="text-xs text-slate-400">O‘tish chegarasi: 60%</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicAnalytics} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="ortacha" name="O‘rtacha %" fill="#1E40AF" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-[#0F2547]">O‘quvchilar reytingi va holati</h2>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {studentSummaries.map(({ student, attemptsCount, avg, passedTopics, latest }) => (
                  <div key={student.id} className="py-2.5 flex items-center justify-between gap-2 text-sm">
                    <div>
                      <div className="font-semibold text-slate-900">{student.fullName}</div>
                      <div className="text-xs text-slate-500">
                        {student.groupName || 'Guruhsiz'} • {attemptsCount} ta urinish • {passedTopics} mavzu o‘tildi
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${avg >= 60 ? 'text-emerald-600' : attemptsCount === 0 ? 'text-slate-400' : 'text-rose-600'}`}>
                        {attemptsCount > 0 ? `${avg}%` : '—'}
                      </div>
                      {latest && (
                        <button type="button" onClick={() => onOpenAttempt(latest.id)} className="text-[11px] text-blue-700 hover:underline">
                          Oxirgi test
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Most Missed Questions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-[#0F2547]">Eng ko‘p xato qilinadigan savollar (Qayta tushuntirish uchun)</h2>
            {mostMissedQuestions.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">
                O‘quvchilar testlarni ishlagach, eng ko‘p xato qilingan savollar avtomatik shu jadvalda ko‘rinadi.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {mostMissedQuestions.map(({ q, wrong, total }, idx) => (
                  <div key={q.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-rose-600">#{idx + 1}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">{CATEGORY_META[q.category]}</span>
                        <span className="text-slate-400">{q.topicId}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-900">{q.text}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold shrink-0">
                      {wrong}/{total} xato ({Math.round((wrong / total) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RESULTS */}
      {tab === 'results' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                value={resultSearch}
                onChange={(e) => setResultSearch(e.target.value)}
                placeholder="O‘quvchi ismi bo‘yicha..."
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={resultTopicFilter}
                onChange={(e) => setResultTopicFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm bg-white"
              >
                <option value="all">Barcha mavzular</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.order}-mavzu: {t.shortTitle}</option>
                ))}
                <option value="final-exam">Umumiy yakuniy imtihon</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setOnlyBelow60((v) => !v)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                onlyBelow60 ? 'bg-rose-600 text-white border-rose-600' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>60% dan past natijalarni ajratish</span>
            </button>
          </div>

          {filteredAttempts.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">Tanlangan filtr bo‘yicha natijalar topilmadi.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5">O‘quvchi</th>
                    <th className="px-3 py-2.5">Mavzu</th>
                    <th className="px-3 py-2.5">Ball</th>
                    <th className="px-3 py-2.5">Holat</th>
                    <th className="px-3 py-2.5">Sana</th>
                    <th className="px-3 py-2.5 text-right">Xatolar tahlili</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttempts.map((a) => {
                    const grade = getGradeInfo(a.score, a.totalQuestions);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-slate-900">{a.studentName}</div>
                          {a.studentGroup && <div className="text-[11px] text-slate-400">{a.studentGroup}</div>}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">{a.topicTitle}</td>
                        <td className="px-3 py-2.5 font-bold">
                          <span className={a.percentage < 60 ? 'text-rose-600' : 'text-emerald-700'}>
                            {a.score}/{a.totalQuestions} ({a.percentage}%)
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${grade.bgClass} ${grade.colorClass}`}>
                            {a.isProvisional ? 'Tekshiruvda' : grade.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-500">{formatDate(a.completedAt)}</td>
                        <td className="px-3 py-2.5 text-right">
                          <button type="button" onClick={() => onOpenAttempt(a.id)} className="text-xs font-semibold text-blue-700 hover:underline">
                            Batafsil ko‘rish
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PENDING REVIEWS */}
      {tab === 'reviews' && (
        <div className="space-y-4">
          {pendingItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
              <ClipboardCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              Hozircha mentor tekshiruvini kutayotgan yopiq javoblar yo‘q.
            </div>
          ) : (
            pendingItems.map(({ attempt, result, question }) => (
              <div key={`${attempt.id}-${result.questionId}`} className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-500">
                    O‘quvchi: <strong className="text-slate-900">{attempt.studentName}</strong> • {attempt.topicTitle}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">Tekshiruv kutilmoqda</span>
                </div>
                <p className="font-semibold text-slate-900 text-sm">{question.text}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
                    <div className="text-[11px] font-bold uppercase text-blue-700">O‘quvchi javobi</div>
                    <div className="mt-1 text-slate-900">{result.userAnswer}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="text-[11px] font-bold uppercase text-emerald-700">Namunaviy javob / Izoh</div>
                    <div className="mt-1 text-slate-800">{question.explanation}</div>
                  </div>
                </div>
                <div className="flex justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onReviewDecision(attempt.id, result.questionId, false)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 text-xs font-bold transition"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Noto‘g‘ri (0 ball)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onReviewDecision(attempt.id, result.questionId, true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>To‘g‘ri (+1 ball)</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: STUDENTS ACCOUNT MANAGEMENT */}
      {tab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#0F2547] flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" />
              Yangi o‘quvchi qo‘shish
            </h2>
            <form onSubmit={handleAddStudentSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ism-familiya</label>
                <input value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} required placeholder="Masalan: Dilshod Bekov" className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Login</label>
                <input value={newStudentLogin} onChange={(e) => setNewStudentLogin(e.target.value)} required placeholder="dilshod" className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Parol</label>
                <input value={newStudentPass} onChange={(e) => setNewStudentPass(e.target.value)} required className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Guruh</label>
                <input value={newStudentGroup} onChange={(e) => setNewStudentGroup(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-[#0F2547] hover:bg-[#193A6E] text-white text-xs font-bold">
                O‘quvchi hisobini yaratish
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-[#0F2547]">Ro‘yxatdan o‘tgan o‘quvchilar ({studentAccounts.length})</h2>
            <div className="divide-y divide-slate-100">
              {studentAccounts.map((st) => (
                <div key={st.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div>
                    <div className="font-bold text-slate-900">{st.fullName}</div>
                    <div className="text-xs text-slate-500">
                      Login: <code className="font-mono text-blue-700">{st.username}</code> • Guruh: {st.groupName || '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setResetPassModal({ user: st, pass: '' })}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Parolni almashtirish
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteUser(st.id)}
                      className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50"
                      title="O‘chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TOPICS MANAGEMENT */}
      {tab === 'topics' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button type="button" onClick={() => setIsAddingTopic(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F2547] hover:bg-[#193A6E] text-white text-xs font-semibold">
              <Plus className="w-4 h-4" />
              <span>Yangi mavzu qo‘shish</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-blue-700">{t.order}-MAVZU</span>
                    <span className="text-xs text-slate-500">{questions.filter((q) => q.topicId === t.id).length} ta savol</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mt-1">{t.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">{t.description}</p>
                </div>
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setEditingTopic(t)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-[#0F2547] hover:bg-slate-50">
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Mavzuni tahrirlash</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: QUESTIONS MANAGEMENT */}
      {tab === 'questions' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <select value={qTopicFilter} onChange={(e) => setQTopicFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white">
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.order}-mavzu: {t.shortTitle}</option>
                ))}
                <option value="final-exam">Umumiy yakuniy imtihon</option>
                <option value="all">Barcha savollar ({questions.length})</option>
              </select>
              <input type="text" value={qSearch} onChange={(e) => setQSearch(e.target.value)} placeholder="Savol matnidan qidirish..." className="px-3 py-2 rounded-xl border border-slate-200 text-sm w-56" />
            </div>

            <button type="button" onClick={() => setIsAddingQuestion(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F2547] hover:bg-[#193A6E] text-white text-xs font-semibold">
              <Plus className="w-4 h-4" />
              <span>Savol qo‘shish</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredQuestions.map((q, idx) => (
              <div key={q.id} className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-[#0F2547]">#{idx + 1}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${DIFFICULTY_META[q.difficulty].badge}`}>{DIFFICULTY_META[q.difficulty].label}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                      {q.type === 'mcq' ? `Kalit: ${q.correctOption}` : `Kalit: ${(q.acceptedAnswers || [])[0] || ''}`}
                    </span>
                    <span className="text-[11px] text-slate-400">{CATEGORY_META[q.category]}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">{q.text}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" onClick={() => setEditingQuestion(q)} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-[#0F2547] hover:bg-slate-50" title="Tahrirlash">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setDeleteConfirmId(q.id)} className="p-2 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50" title="O‘chirish">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: HOSTING & CLOUD SYNC (SUPABASE) */}
      {tab === 'cloud' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0F2547]">Masofaviy Hosting va Supabase ulash</h2>
                <p className="text-xs text-slate-500">Barcha o‘quvchilar uydan ishlaganda natijalar umumiy bazaga tushishi uchun</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Supabase Project URL</label>
                <input
                  type="url"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  placeholder="https://xxxxx.supabase.co"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Supabase Anon Public Key</label>
                <input
                  type="password"
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input type="checkbox" checked={sbEnabled} onChange={(e) => setSbEnabled(e.target.checked)} />
                <span>Bulutli sinxronizatsiyani yoqish</span>
              </label>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onSaveCloudConfig({ supabaseUrl: sbUrl.trim(), supabaseAnonKey: sbKey.trim(), enabled: sbEnabled })}
                  className="px-4 py-2 rounded-xl bg-[#0F2547] hover:bg-[#193A6E] text-white text-xs font-semibold"
                >
                  Sozlamalarni saqlash
                </button>
                {cloudConfig.enabled && (
                  <button
                    type="button"
                    onClick={onSyncNow}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    Hozir sinxronlash
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-[#0F2547]">Supabase SQL sxemasi (1 marta ishga tushiring)</h3>
            <p className="text-xs text-slate-500">
              Supabase SQL Editor da quyidagi kodni ishga tushiring — barcha o‘quvchilar natijalari markaziy bazada saqlanadi.
            </p>
            <CodeBlock code={SUPABASE_SQL_SCHEMA} label="PostgreSQL / Supabase SQL" />
          </div>
        </div>
      )}

      {/* MODALS */}
      {resetPassModal && (
        <Modal onClose={() => setResetPassModal(null)} title={`Parolni yangilash: ${resetPassModal.user.fullName}`}>
          <div className="space-y-4">
            <input
              type="text"
              value={resetPassModal.pass}
              onChange={(e) => setResetPassModal({ ...resetPassModal, pass: e.target.value })}
              placeholder="Yangi parol (kamida 4 belgi)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-sm"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setResetPassModal(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm">Bekor qilish</button>
              <button
                type="button"
                onClick={() => {
                  if (resetPassModal.pass.length < 4) {
                    showToast('Parol kamida 4 belgidan iborat bo‘lsin.', 'error');
                    return;
                  }
                  onResetPassword(resetPassModal.user.id, resetPassModal.pass);
                  setResetPassModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#0F2547] text-white text-sm font-semibold"
              >
                Yangilash
              </button>
            </div>
          </div>
        </Modal>
      )}

      {(isAddingTopic || editingTopic) && (
        <TopicEditorModal
          initial={editingTopic}
          nextOrder={topics.length + 1}
          onClose={() => { setIsAddingTopic(false); setEditingTopic(null); }}
          onSave={(t) => {
            if (editingTopic) onUpdateTopic(t);
            else onAddTopic(t);
            setIsAddingTopic(false);
            setEditingTopic(null);
          }}
        />
      )}

      {(isAddingQuestion || editingQuestion) && (
        <QuestionEditorModal
          initial={editingQuestion}
          defaultTopicId={qTopicFilter === 'all' ? 'topic-1' : qTopicFilter}
          topics={topics}
          onClose={() => { setIsAddingQuestion(false); setEditingQuestion(null); }}
          onSave={(q) => {
            if (editingQuestion) onUpdateQuestion(q);
            else onAddQuestion(q);
            setIsAddingQuestion(false);
            setEditingQuestion(null);
          }}
        />
      )}

      {deleteConfirmId && (
        <Modal onClose={() => setDeleteConfirmId(null)} title="Savolni o‘chirish">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Ushbu test savolini butunlay o‘chirib tashlamoqchimisiz?</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm">Bekor qilish</button>
              <button type="button" onClick={() => { onDeleteQuestion(deleteConfirmId); setDeleteConfirmId(null); }} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold">O‘chirish</button>
            </div>
          </div>
        </Modal>
      )}

      {jsonModalOpen && (
        <Modal onClose={() => setJsonModalOpen(false)} title="Savollarni JSON orqali import qilish">
          <div className="space-y-3">
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setJsonInput(String(reader.result || ''));
                reader.readAsText(file);
              }}
              className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold"
            />
            <textarea
              rows={7}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='[{"id":"custom-1","topicId":"topic-1","type":"mcq","difficulty":"easy","category":"theory","text":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"correctOption":"A","explanation":"..."}]'
              className="w-full p-3 rounded-xl border border-slate-200 font-mono text-xs"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setJsonModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm">Bekor qilish</button>
              <button type="button" onClick={handleJSONImportSubmit} className="px-4 py-2 rounded-xl bg-[#0F2547] text-white text-sm font-semibold">Import qilish</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ============================================================================
// SHARED MODALS
// ============================================================================
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  onClose,
  children
}) => (
  <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="font-bold text-[#0F2547]">{title}</h3>
        <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const TopicEditorModal: React.FC<{
  initial: Topic | null;
  nextOrder: number;
  onClose: () => void;
  onSave: (t: Topic) => void;
}> = ({ initial, nextOrder, onClose, onSave }) => {
  const [title, setTitle] = useState(initial?.title || `${nextOrder}-MAVZU. `);
  const [shortTitle, setShortTitle] = useState(initial?.shortTitle || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [techText, setTechText] = useState((initial?.technologies || []).join('\n'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: initial?.id || `topic-${Date.now()}`,
      order: initial?.order || nextOrder,
      title: title.trim(),
      shortTitle: shortTitle.trim() || title.trim().slice(0, 28),
      description: description.trim(),
      technologies: techText.split('\n').map((s) => s.trim()).filter(Boolean)
    });
  };

  return (
    <Modal title={initial ? 'Mavzuni tahrirlash' : 'Yangi mavzu qo‘shish'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Mavzu nomi</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Qisqa nom</label>
          <input value={shortTitle} onChange={(e) => setShortTitle(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Tavsif</label>
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Texnologiyalar (har birini yangi qatordan)</label>
          <textarea rows={5} value={techText} onChange={(e) => setTechText(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-sm">Bekor qilish</button>
          <button type="submit" className="px-4 py-2 rounded-xl bg-[#0F2547] text-white text-sm font-semibold">Saqlash</button>
        </div>
      </form>
    </Modal>
  );
};

const QuestionEditorModal: React.FC<{
  initial: Question | null;
  defaultTopicId: string;
  topics: Topic[];
  onClose: () => void;
  onSave: (q: Question) => void;
}> = ({ initial, defaultTopicId, topics, onClose, onSave }) => {
  const [topicId, setTopicId] = useState(initial?.topicId || defaultTopicId);
  const [type, setType] = useState<QuestionType>(initial?.type || 'mcq');
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty || 'medium');
  const [category, setCategory] = useState<QuestionCategory>(initial?.category || 'theory');
  const [text, setText] = useState(initial?.text || '');
  const [code, setCode] = useState(initial?.code || '');
  const [optA, setOptA] = useState(initial?.options?.A || '');
  const [optB, setOptB] = useState(initial?.options?.B || '');
  const [optC, setOptC] = useState(initial?.options?.C || '');
  const [optD, setOptD] = useState(initial?.options?.D || '');
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>(initial?.correctOption || 'A');
  const [acceptedStr, setAcceptedStr] = useState((initial?.acceptedAnswers || []).join(', '));
  const [requiresMentorReview, setRequiresMentorReview] = useState(Boolean(initial?.requiresMentorReview));
  const [explanation, setExplanation] = useState(initial?.explanation || '');
  const [codeExplanation, setCodeExplanation] = useState(initial?.codeExplanation || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !explanation.trim()) return;
    const base: Question = {
      id: initial?.id || `q-${Date.now()}`,
      topicId,
      type,
      difficulty,
      category,
      text: text.trim(),
      code: code.trim() || undefined,
      explanation: explanation.trim(),
      codeExplanation: codeExplanation.trim() || undefined
    };
    if (type === 'mcq') {
      base.options = { A: optA.trim(), B: optB.trim(), C: optC.trim(), D: optD.trim() };
      base.correctOption = correctOption;
    } else {
      base.acceptedAnswers = acceptedStr.split(',').map((s) => s.trim()).filter(Boolean);
      base.requiresMentorReview = requiresMentorReview;
    }
    onSave(base);
  };

  return (
    <Modal title={initial ? 'Savolni tahrirlash' : 'Yangi test savoli qo‘shish'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Mavzu</label>
            <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.order}-mavzu: {t.shortTitle}</option>
              ))}
              <option value="final-exam">Yakuniy imtihon</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Savol turi</label>
            <select value={type} onChange={(e) => setType(e.target.value as QuestionType)} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
              <option value="mcq">Variantli (A, B, C, D)</option>
              <option value="open">Yopiq (mustaqil javob)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Qiyinlik</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
              <option value="easy">Oson</option>
              <option value="medium">O‘rta</option>
              <option value="hard">Murakkab</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Yo‘nalish</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as QuestionCategory)} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
              <option value="theory">Nazariy bilim</option>
              <option value="terms">Atamalar va prinsip</option>
              <option value="code_analysis">Kod tahlili</option>
              <option value="bug_finding">Xato topish</option>
              <option value="practical">Amaliy vaziyat</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Savol matni</label>
          <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} required className="w-full px-3 py-2 rounded-xl border border-slate-200" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Kod bloki (ixtiyoriy)</label>
          <textarea rows={3} value={code} onChange={(e) => setCode(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs" />
        </div>

        {type === 'mcq' ? (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input value={optA} onChange={(e) => setOptA(e.target.value)} required placeholder="A varianti" className="px-3 py-2 rounded-xl border border-slate-200" />
              <input value={optB} onChange={(e) => setOptB(e.target.value)} required placeholder="B varianti" className="px-3 py-2 rounded-xl border border-slate-200" />
              <input value={optC} onChange={(e) => setOptC(e.target.value)} required placeholder="C varianti" className="px-3 py-2 rounded-xl border border-slate-200" />
              <input value={optD} onChange={(e) => setOptD(e.target.value)} required placeholder="D varianti" className="px-3 py-2 rounded-xl border border-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">To‘g‘ri javob kaliti</label>
              <select value={correctOption} onChange={(e) => setCorrectOption(e.target.value as 'A' | 'B' | 'C' | 'D')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Qabul qilinadigan javoblar (vergul bilan)</label>
              <input value={acceptedStr} onChange={(e) => setAcceptedStr(e.target.value)} required className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs" />
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-slate-700">
              <input type="checkbox" checked={requiresMentorReview} onChange={(e) => setRequiresMentorReview(e.target.checked)} />
              <span>Aniq mos kelmasa mentor tekshiruviga yuborilsin</span>
            </label>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Tushuntirish</label>
          <textarea rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)} required className="w-full px-3 py-2 rounded-xl border border-slate-200" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Kod izohi (ixtiyoriy)</label>
          <input value={codeExplanation} onChange={(e) => setCodeExplanation(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200">Bekor qilish</button>
          <button type="submit" className="px-4 py-2 rounded-xl bg-[#0F2547] text-white font-semibold">Saqlash</button>
        </div>
      </form>
    </Modal>
  );
};
