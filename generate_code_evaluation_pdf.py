from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

report_path = 'code_evaluation.pdf'
texts = [
    ('عنوان التقرير', 'تقييم كود مشروع Kafka Learning'),
    ('نظرة عامة',
     'تمت مراجعة ملفات المشروع الأساسية، بما فيها البنية التحتية، طبقة الاستخدام، وحدات التحكم، وإعدادات TypeScript. المشروع يستخدم بنية تعتمد على Clean Architecture مع فصل واضح بين adapters و use-cases.'),
    ('نقاط القوة',
     '- فصل مهمات الكود عبر طبقات: use-case، controller، infrastructure.\n- تكامل مع Kafka و Prometheus و WebSocket بطريقة واضحة.\n- استخدام TypeScript مع async/await و واجهات (interfaces) لتعزيز وضوح العقد.\n- إعداد `express` و `cors` و middleware للتتبع بجانب تسجيل المقاييس.'),
    ('نقاط التحسين',
     '- استخدام GET لوضع أمر جديد في `/api/order` غير مناسب معماريًا؛ يفضل POST لـ REST.\n- وجود تأخير ثابت 3 ثواني في middleware و use-case يضر بالأداء ولا يعود بفائدة إنتاجية.\n- `environment.ts` يحمل dotenv لكنه لا يقرأ متغيرات البيئة الفعلية لدعم التهيئة في بيئات مختلفة.\n- لا يوجد تعريف نوعي صريح لـ `req.traceId` في Express، وقد يسبب هذا خطأ Typescript عند التحقق الصارم.\n- المعالجة الخاطئة للأخطاء عند إنشاء خادم HTTP قبل التأكد من نجاح اتصال Kafka.\n- بعض الاعتمادات تتصل مباشرة بتطبيق `PrometheusMetricsTracker` بدلًا من واجهة عامة، مما يزيد الاقتران.'),
    ('ملاحظات تقنية',
     '- استخدام `skipLibCheck` مفيد لتجاوز أخطاء typings لكنه قد يخفي مشاكل نوعية.\n- يستحسن إنشاء فئة أو ملف `config` يقرأ القيم من `process.env` مع قيم افتراضية.\n- تحسينات لـ metrics: إضافة تتبع مناسب لمقاييس `disk`, `cpu`, `ram` عند فشل Prometheus.\n- فصل واجبات إضافية في `main.ts` يسمح بسهولة الاختبار، لكن يحتاج إلى مزيد من التجريبيّة في التعامل مع الأخطاء وإعادة المحاولة.'),
    ('التقييم العام',
     'المشروع في حالة جيدة كبداية مع هيكلية مفهومة ومنطقية. يحتاج إلى بعض التحسينات المهمة في إدارة الأخطاء، تهيئة البيئة، والتوافق مع ممارسات REST القياسية.')
]
ratings = [
    ('البنية المعمارية', '4.0 / 5'),
    ('جودة الكود', '3.5 / 5'),
    ('الموثوقية ومعالجة الأخطاء', '3.0 / 5'),
    ('قابلية الصيانة والتوسع', '3.5 / 5'),
    ('التوثيق والتنسيق', '3.0 / 5'),
    ('التقييم العام', '3.5 / 5')
]

doc = SimpleDocTemplate(report_path, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
styles = getSampleStyleSheet()
heading1 = ParagraphStyle(name='MyHeading1', parent=styles['Heading1'], fontSize=18, leading=22, spaceAfter=14)
heading2 = ParagraphStyle(name='MyHeading2', parent=styles['Heading2'], fontSize=14, leading=18, spaceAfter=10)
body = ParagraphStyle(name='MyBodyText', parent=styles['BodyText'], fontSize=11, leading=15)

story = []
story.append(Paragraph('تقييم كود مشروع Kafka Learning', heading1))
for title, paragraph_body in texts:
    story.append(Paragraph(title, heading2))
    for line in paragraph_body.split('\n'):
        story.append(Paragraph(line.strip(), body))
    story.append(Spacer(1, 12))

story.append(Paragraph('الدرجات التفصيلية', heading2))
for criterion, score in ratings:
    story.append(Paragraph(f'- <b>{criterion}</b>: {score}', body))

story.append(Spacer(1, 12))
story.append(Paragraph('توصية عامة', heading2))
story.append(Paragraph('ينصح بالعمل على تحسين التهيئة البيئية، تعديل واجهات API لتكون أكثر RESTful، وإزالة التأخير الاصطناعي قبل نشر المشروع في بيئة إنتاج.', body))

doc.build(story)
print(f'PDF generated: {report_path}')
