// UI translations. To add a new Indian language later, add its code to
// LANGUAGES and a matching block below — no other code changes needed.
// Odia strings should be reviewed by a native speaker before launch.

export type LangCode = 'en' | 'or'

export interface LangMeta {
  code: LangCode
  label: string // shown in the switcher, in its own script
}

export const LANGUAGES: LangMeta[] = [
  { code: 'en', label: 'English' },
  { code: 'or', label: 'ଓଡ଼ିଆ' },
]

// Flat key -> string. Use {placeholders} for interpolation.
type Dict = Record<string, string>

const en: Dict = {
  'app.loading': 'Loading…',
  'app.online': 'Online',
  'app.offline': 'Offline — your saved questions still work',
  'app.footer': '100% free • Works offline • Made for students ❤️',
  'app.back': 'Back',
  'auth.signIn': 'Sign in',
  'auth.signInHint': 'Sign in with Google to save your progress across devices',
  'auth.signOut': 'Sign out',

  'home.sections': '{n} sections',
  'home.ca.title': 'Daily Current Affairs',
  'home.ca.subtitle': "Today's news, made for exams",
  'home.exams': 'Exams',
  'home.streak': '{n}-day streak',
  'home.revise.title': 'Revise your mistakes',
  'home.revise.subtitle': '{n} question(s) due for revision',

  'review.title': 'Revision',

  'exam.testType': 'Test type',
  'exam.mock': '🧪 Mock test',
  'exam.practice': '✏️ Practice (with answers)',
  'exam.section': 'Section',
  'exam.all': 'All',
  'exam.available': '{n} question(s) available',
  'exam.startMock': 'Start Mock Test',
  'exam.startPractice': 'Start Practice',
  'exam.weakTopics': 'Your weak topics',
  'exam.viewHistory': 'View full history & analysis',
  'exam.revise': 'Revise mistakes ({n})',
  'exam.practiceWeak': 'Practice my weak topics',
  'exam.difficulty': 'Difficulty',
  'diff.all': 'All',
  'diff.easy': 'Easy',
  'diff.medium': 'Medium',
  'diff.hard': 'Hard',
  'diff.expert': 'Expert',

  'quiz.progress': 'Question {i} / {n}',
  'quiz.next': 'Next',
  'quiz.finish': 'Finish',
  'quiz.skip': 'Skip',
  'quiz.correct': '✅ Correct!',
  'quiz.wrong': '❌ Not quite.',
  'quiz.negativeNote': 'Mock test: {mark} mark deducted per wrong answer.',

  'res.correct': 'Correct',
  'res.wrong': 'Wrong',
  'res.skipped': 'Skipped',
  'res.time': 'Time',
  'res.netScore': 'Net score',
  'res.ofCorrect': '{c} / {t} correct',
  'res.analysis': 'Topic-wise analysis',
  'res.focusTip': '💡 Focus next on your lowest-scoring topics above.',
  'res.review': 'Review answers',
  'res.correctLabel': 'Correct:',
  'res.yourAnswer': 'Your answer:',
  'res.tryAgain': 'Try again',
  'res.backHome': 'Back to home',

  'hist.average': 'average across {n} test(s)',
  'hist.weakest': 'Topics — weakest first',
  'hist.recent': 'Recent tests',
  'hist.none': 'No attempts yet. Take a test to see your analysis.',
  'hist.allSections': 'All sections',

  'ca.title': 'Daily Current Affairs',
  'ca.updated': 'Updated {date}',
  'ca.takeQuiz': '🧠 Take quiz on these',
  'ca.none': 'No current affairs yet. Check back tomorrow!',
  'ca.source': 'Source',
  'ca.points': "Today's key points",

  'report.action': 'Report',
  'report.done': '✓ Reported — thank you!',

  'install.title': 'Install Aspirant',
  'install.subtitle': 'Add to your home screen to study offline anytime.',
  'install.action': 'Install',
  'install.dismiss': 'Not now',
  'install.iosHint': 'Tap Share, then "Add to Home Screen".',

  'settings.title': 'Settings',
  'settings.theme': 'Theme',
  'settings.light': '☀️ Light',
  'settings.dark': '🌙 Dark',
  'settings.auto': '🅰 Auto',
  'settings.textSize': 'Text size',
  'settings.sizeNormal': 'Normal',
  'settings.sizeLarge': 'Large',
  'settings.sizeXl': 'Extra large',
  'settings.hint': 'Settings are saved on this device.',

  'qotd.title': 'Question of the Day',

  'res.share': 'Share my score',
  'res.shareText': 'I scored {pct}% on {exam} in Aspirant — free exam prep! {url}',

  'exam.fullmock': '📝 Full Mock',
  'exam.startFullmock': 'Start Full Mock',

  'mock.answered': '{n} answered',
  'mock.prev': 'Prev',
  'mock.next': 'Next',
  'mock.mark': '🚩 Mark for review',
  'mock.marked': '🚩 Marked',
  'mock.palette': 'Questions',
  'mock.submit': 'Submit test',
  'mock.confirm': 'You answered {answered} of {total}. Submit now?',
  'mock.submitConfirm': 'Yes, submit',
  'mock.cancel': 'Keep going',

  'exam.insights': 'Trends & Predicted',
  'insights.title': 'Trends & Predicted',
  'insights.intro': 'Based on past-year questions: the topics asked most often, and the questions most likely to repeat.',
  'insights.weightage': 'Topic weightage (most asked)',
  'insights.repeated': 'Frequently repeated',
  'insights.repeatedNone': 'Not enough past papers yet to spot repeats — check back as the bank grows.',
  'insights.appeared': '{n}×',
  'insights.years': 'Years',
  'insights.practicePredicted': 'Practice predicted questions',
  'insights.prob.high': 'High chance',
  'insights.prob.medium': 'Medium chance',
  'insights.prob.low': 'Low chance',
  'insights.disclaimer': 'Predictions are guidance from past patterns, not a guarantee.',

  'about.title': 'About & Legal',
  'about.disclaimerTitle': 'Disclaimer',
  'about.disclaimer':
    'Aspirant is an independent, free study app. It is not affiliated with, endorsed by, or connected to IBPS, SBI, OPSC, OSSSC or any exam body. All exam names and trademarks belong to their respective owners.',
  'about.privacyTitle': 'Your privacy',
  'about.privacy':
    'Your answers, scores and settings are stored only on your device. We add no trackers. If you choose to sign in with Google, your test history is backed up to your own private account so you can sync across devices — nothing is shared publicly.',
  'about.creditsTitle': 'Credits',
  'about.credits':
    'Some general-knowledge questions are from Open Trivia DB (CC BY-SA 4.0). Current affairs are summarised from public news feeds. Built with React.',
  'about.madeWith': 'Made with ❤️ for students. Free forever.',
}

const or: Dict = {
  'app.loading': 'ଲୋଡ୍ ହେଉଛି…',
  'app.online': 'ଅନଲାଇନ୍',
  'app.offline': 'ଅଫଲାଇନ୍ — ଆପଣଙ୍କ ସେଭ୍ ହୋଇଥିବା ପ୍ରଶ୍ନ ଏବେ ବି କାମ କରେ',
  'app.footer': '୧୦୦% ମାଗଣା • ଅଫଲାଇନ୍ କାମ କରେ • ଛାତ୍ରମାନଙ୍କ ପାଇଁ ❤️',
  'app.back': 'ପଛକୁ',
  'auth.signIn': 'ସାଇନ୍ ଇନ୍',
  'auth.signInHint': 'ଆପଣଙ୍କ ପ୍ରଗତି ସବୁ ଡିଭାଇସରେ ସେଭ୍ କରିବାକୁ ଗୁଗୁଲ୍ ସହ ସାଇନ୍ ଇନ୍ କରନ୍ତୁ',
  'auth.signOut': 'ସାଇନ୍ ଆଉଟ୍',

  'home.sections': '{n} ବିଭାଗ',
  'home.ca.title': 'ଦୈନିକ ସାମ୍ପ୍ରତିକ ବିଷୟ',
  'home.ca.subtitle': 'ପରୀକ୍ଷା ପାଇଁ ଆଜିର ଖବର',
  'home.exams': 'ପରୀକ୍ଷା',
  'home.streak': '{n} ଦିନର ଧାରା',
  'home.revise.title': 'ଆପଣଙ୍କ ଭୁଲ୍ ସମୀକ୍ଷା କରନ୍ତୁ',
  'home.revise.subtitle': '{n} ଟି ପ୍ରଶ୍ନ ସମୀକ୍ଷା ପାଇଁ ବାକି',

  'review.title': 'ସମୀକ୍ଷା',

  'exam.testType': 'ପରୀକ୍ଷା ପ୍ରକାର',
  'exam.mock': '🧪 ମକ୍ ଟେଷ୍ଟ',
  'exam.practice': '✏️ ଅଭ୍ୟାସ (ଉତ୍ତର ସହିତ)',
  'exam.section': 'ବିଭାଗ',
  'exam.all': 'ସମସ୍ତ',
  'exam.available': '{n} ଟି ପ୍ରଶ୍ନ ଉପଲବ୍ଧ',
  'exam.startMock': 'ମକ୍ ଟେଷ୍ଟ ଆରମ୍ଭ କରନ୍ତୁ',
  'exam.startPractice': 'ଅଭ୍ୟାସ ଆରମ୍ଭ କରନ୍ତୁ',
  'exam.weakTopics': 'ଆପଣଙ୍କ ଦୁର୍ବଳ ବିଷୟ',
  'exam.viewHistory': 'ସମ୍ପୂର୍ଣ୍ଣ ଇତିହାସ ଓ ବିଶ୍ଳେଷଣ ଦେଖନ୍ତୁ',
  'exam.revise': 'ଭୁଲ୍ ସମୀକ୍ଷା କରନ୍ତୁ ({n})',
  'exam.practiceWeak': 'ମୋର ଦୁର୍ବଳ ବିଷୟ ଅଭ୍ୟାସ କରନ୍ତୁ',
  'exam.difficulty': 'କଠିନତା',
  'diff.all': 'ସମସ୍ତ',
  'diff.easy': 'ସହଜ',
  'diff.medium': 'ମଧ୍ୟମ',
  'diff.hard': 'କଠିନ',
  'diff.expert': 'ବିଶେଷଜ୍ଞ',

  'quiz.progress': 'ପ୍ରଶ୍ନ {i} / {n}',
  'quiz.next': 'ପରବର୍ତ୍ତୀ',
  'quiz.finish': 'ସମାପ୍ତ',
  'quiz.skip': 'ଛାଡ଼ନ୍ତୁ',
  'quiz.correct': '✅ ଠିକ୍!',
  'quiz.wrong': '❌ ଭୁଲ୍।',
  'quiz.negativeNote': 'ମକ୍ ଟେଷ୍ଟ: ପ୍ରତ୍ୟେକ ଭୁଲ୍ ଉତ୍ତର ପାଇଁ {mark} ମାର୍କ କଟାଯିବ।',

  'res.correct': 'ଠିକ୍',
  'res.wrong': 'ଭୁଲ୍',
  'res.skipped': 'ଛାଡ଼ିଗଲା',
  'res.time': 'ସମୟ',
  'res.netScore': 'ନିଟ୍ ସ୍କୋର',
  'res.ofCorrect': '{c} / {t} ଠିକ୍',
  'res.analysis': 'ବିଷୟ-ଭିତ୍ତିକ ବିଶ୍ଳେଷଣ',
  'res.focusTip': '💡 ଉପରେ ଥିବା ସର୍ବନିମ୍ନ ସ୍କୋର ବିଷୟ ଉପରେ ଧ୍ୟାନ ଦିଅନ୍ତୁ।',
  'res.review': 'ଉତ୍ତର ସମୀକ୍ଷା',
  'res.correctLabel': 'ଠିକ୍:',
  'res.yourAnswer': 'ଆପଣଙ୍କ ଉତ୍ତର:',
  'res.tryAgain': 'ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ',
  'res.backHome': 'ମୂଳପୃଷ୍ଠାକୁ ଫେରନ୍ତୁ',

  'hist.average': '{n} ଟି ପରୀକ୍ଷାର ହାରାହାରି',
  'hist.weakest': 'ବିଷୟ — ଦୁର୍ବଳ ପ୍ରଥମେ',
  'hist.recent': 'ସାମ୍ପ୍ରତିକ ପରୀକ୍ଷା',
  'hist.none': 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ପ୍ରଚେଷ୍ଟା ନାହିଁ। ବିଶ୍ଳେଷଣ ଦେଖିବାକୁ ଏକ ପରୀକ୍ଷା ଦିଅନ୍ତୁ।',
  'hist.allSections': 'ସମସ୍ତ ବିଭାଗ',

  'ca.title': 'ଦୈନିକ ସାମ୍ପ୍ରତିକ ବିଷୟ',
  'ca.updated': '{date} ରେ ଅପଡେଟ୍',
  'ca.takeQuiz': '🧠 ଏଗୁଡ଼ିକ ଉପରେ କୁଇଜ୍ ଦିଅନ୍ତୁ',
  'ca.none': 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ସାମ୍ପ୍ରତିକ ବିଷୟ ନାହିଁ। କାଲି ପୁଣି ଦେଖନ୍ତୁ!',
  'ca.source': 'ଉତ୍ସ',
  'ca.points': 'ଆଜିର ମୁଖ୍ୟ ବିଷୟ',

  'report.action': 'ରିପୋର୍ଟ',
  'report.done': '✓ ରିପୋର୍ଟ ହେଲା — ଧନ୍ୟବାଦ!',

  'install.title': 'Aspirant ଇନଷ୍ଟଲ୍ କରନ୍ତୁ',
  'install.subtitle': 'ଯେକୌଣସି ସମୟରେ ଅଫଲାଇନ୍ ପଢ଼ିବାକୁ ହୋମ୍ ସ୍କ୍ରିନରେ ଯୋଗ କରନ୍ତୁ।',
  'install.action': 'ଇନଷ୍ଟଲ୍',
  'install.dismiss': 'ବର୍ତ୍ତମାନ ନୁହେଁ',
  'install.iosHint': 'Share ଟାପ୍ କରନ୍ତୁ, ତାପରେ "Add to Home Screen"।',

  'settings.title': 'ସେଟିଂସ୍',
  'settings.theme': 'ଥିମ୍',
  'settings.light': '☀️ ଆଲୋକ',
  'settings.dark': '🌙 ଅନ୍ଧାର',
  'settings.auto': '🅰 ଅଟୋ',
  'settings.textSize': 'ଅକ୍ଷର ଆକାର',
  'settings.sizeNormal': 'ସାଧାରଣ',
  'settings.sizeLarge': 'ବଡ଼',
  'settings.sizeXl': 'ଅଧିକ ବଡ଼',
  'settings.hint': 'ସେଟିଂସ୍ ଏହି ଡିଭାଇସରେ ସେଭ୍ ହୁଏ।',

  'qotd.title': 'ଆଜିର ପ୍ରଶ୍ନ',

  'res.share': 'ମୋ ସ୍କୋର ସେୟାର କରନ୍ତୁ',
  'res.shareText': 'ମୁଁ Aspirant ରେ {exam} ରେ {pct}% ସ୍କୋର କଲି — ମାଗଣା ପରୀକ୍ଷା ପ୍ରସ୍ତୁତି! {url}',

  'exam.fullmock': '📝 ଫୁଲ୍ ମକ୍',
  'exam.startFullmock': 'ଫୁଲ୍ ମକ୍ ଆରମ୍ଭ କରନ୍ତୁ',

  'mock.answered': '{n} ଉତ୍ତର ଦିଆଗଲା',
  'mock.prev': 'ପୂର୍ବ',
  'mock.next': 'ପର',
  'mock.mark': '🚩 ସମୀକ୍ଷା ପାଇଁ ଚିହ୍ନିତ କରନ୍ତୁ',
  'mock.marked': '🚩 ଚିହ୍ନିତ',
  'mock.palette': 'ପ୍ରଶ୍ନସମୂହ',
  'mock.submit': 'ଟେଷ୍ଟ ଦାଖଲ କରନ୍ତୁ',
  'mock.confirm': 'ଆପଣ {total} ମଧ୍ୟରୁ {answered} ଉତ୍ତର ଦେଇଛନ୍ତି। ଏବେ ଦାଖଲ କରିବେ?',
  'mock.submitConfirm': 'ହଁ, ଦାଖଲ କରନ୍ତୁ',
  'mock.cancel': 'ଜାରି ରଖନ୍ତୁ',

  'exam.insights': 'ଟ୍ରେଣ୍ଡ ଓ ପୂର୍ବାନୁମାନ',
  'insights.title': 'ଟ୍ରେଣ୍ଡ ଓ ପୂର୍ବାନୁମାନ',
  'insights.intro': 'ବିଗତ ବର୍ଷର ପ୍ରଶ୍ନ ଆଧାରରେ: ସବୁଠାରୁ ଅଧିକ ପଚରାଯାଇଥିବା ବିଷୟ ଓ ପୁନରାବୃତ୍ତି ହେବାର ସମ୍ଭାବନା ଥିବା ପ୍ରଶ୍ନ।',
  'insights.weightage': 'ବିଷୟ ୱେଟେଜ୍ (ସର୍ବାଧିକ ପଚରାଯାଇଛି)',
  'insights.repeated': 'ବାରମ୍ବାର ପୁନରାବୃତ୍ତି',
  'insights.repeatedNone': 'ପୁନରାବୃତ୍ତି ଚିହ୍ନଟ କରିବାକୁ ଯଥେଷ୍ଟ ବିଗତ ପ୍ରଶ୍ନ ନାହିଁ — ବ୍ୟାଙ୍କ ବଢ଼ିବା ସହ ପୁଣି ଦେଖନ୍ତୁ।',
  'insights.appeared': '{n}×',
  'insights.years': 'ବର୍ଷ',
  'insights.practicePredicted': 'ପୂର୍ବାନୁମାନିତ ପ୍ରଶ୍ନ ଅଭ୍ୟାସ କରନ୍ତୁ',
  'insights.prob.high': 'ଉଚ୍ଚ ସମ୍ଭାବନା',
  'insights.prob.medium': 'ମଧ୍ୟମ ସମ୍ଭାବନା',
  'insights.prob.low': 'କମ୍ ସମ୍ଭାବନା',
  'insights.disclaimer': 'ପୂର୍ବାନୁମାନ ବିଗତ ଢାଞ୍ଚାରୁ ମାର୍ଗଦର୍ଶନ, ଗ୍ୟାରେଣ୍ଟି ନୁହେଁ।',

  'about.title': 'ବିଷୟରେ ଓ ଆଇନଗତ',
  'about.disclaimerTitle': 'ଅସ୍ୱୀକାରୋକ୍ତି',
  'about.disclaimer':
    'Aspirant ଏକ ସ୍ୱାଧୀନ, ମାଗଣା ଅଧ୍ୟୟନ ଆପ୍। ଏହା IBPS, SBI, OPSC, OSSSC କିମ୍ବା କୌଣସି ପରୀକ୍ଷା ସଂସ୍ଥା ସହ ସମ୍ବନ୍ଧିତ ନୁହେଁ। ସମସ୍ତ ପରୀକ୍ଷା ନାମ ଓ ଟ୍ରେଡମାର୍କ ସେମାନଙ୍କ ମାଲିକଙ୍କର।',
  'about.privacyTitle': 'ଆପଣଙ୍କ ଗୋପନୀୟତା',
  'about.privacy':
    'ଆପଣଙ୍କ ଉତ୍ତର, ସ୍କୋର ଓ ସେଟିଂସ୍ କେବଳ ଆପଣଙ୍କ ଡିଭାଇସରେ ସେଭ୍ ହୁଏ। କୌଣସି ଟ୍ରାକର୍ ନାହିଁ। ଗୁଗୁଲ୍ ସହ ସାଇନ୍ ଇନ୍ କଲେ, ଆପଣଙ୍କ ଇତିହାସ ଆପଣଙ୍କ ନିଜ ଖାତାରେ ବ୍ୟାକଅପ୍ ହୁଏ — କିଛି ସର୍ବସାଧାରଣ ଭାବେ ସେୟାର ହୁଏ ନାହିଁ।',
  'about.creditsTitle': 'କ୍ରେଡିଟ୍',
  'about.credits':
    'କିଛି ସାଧାରଣ ଜ୍ଞାନ ପ୍ରଶ୍ନ Open Trivia DB (CC BY-SA 4.0) ରୁ। ସାମ୍ପ୍ରତିକ ବିଷୟ ସର୍ବସାଧାରଣ ନ୍ୟୁଜ୍ ଫିଡରୁ ସଂକ୍ଷିପ୍ତ। React ରେ ନିର୍ମିତ।',
  'about.madeWith': 'ଛାତ୍ରମାନଙ୍କ ପାଇଁ ❤️ ସହ ନିର୍ମିତ। ସବୁଦିନ ମାଗଣା।',
}

export const TRANSLATIONS: Record<LangCode, Dict> = { en, or }
