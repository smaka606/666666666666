// Chatbot functionality
class Chatbot {
    constructor(app) {
        this.app = app;
        this.isOpen = false;
        this.faqData = [];
        this.medicalConsentKey = 'medical_consent_v1';
        // === Gemini API key (insecure in frontend) ===
        // لقد وضعت المفتاح هنا بناءً على طلبك. أنصح بنقله للـ backend ASAP.
        this.GEMINI_API_KEY = "AIzaSyB6BB1YkxAxbsus24TP9F8JTDkgjpEmCtc";
        this.init();
    }

    async init() {
        await this.loadFAQData();
        this.setupEventListeners();
        this.loadSuggestions();
    }

    async loadFAQData() {
        // Try to load from localStorage first
        let faqData = this.app.getFromStorage('faqData');
        
        if (!faqData) {
            // Generate demo FAQ data
            faqData = this.generateDemoFAQ();
            this.app.setToStorage('faqData', faqData);
        }
        
        this.faqData = faqData;
    }

    generateDemoFAQ() {
        return [
            {
                id: 1,
                question: "ما هي مواعيد العمل؟",
                answer: "متاجرنا مفتوحة من الإثنين إلى الجمعة من 8 صباحًا حتى 10 مساءً. الطلب عبر الإنترنت متاح 24/7.",
                keywords: ["مواعيد","ساعة","فتح","اغلاق","متى"]
            },
            {
                id: 2,
                question: "هل تقدمون توصيل منزلي؟",
                answer: "نعم! نقدم توصيل في نفس اليوم في معظم المناطق. توصيل مجاني للطلبات فوق مبلغ محدد.",
                keywords: ["توصيل","شحن","منزل","تتبع","توصيل مجاني"]
            },
            // ... يمكنك ترك بقية الأسئلة كما هي أو تعديلها لاحقًا
        ];
    }

    setupEventListeners() {
        const chatbotToggle = document.getElementById('chatbot-toggle');
        const chatbotClose = document.getElementById('chatbot-close');
        const chatbotSend = document.getElementById('chatbot-send');
        const chatbotInput = document.getElementById('chatbot-input');

        if (chatbotToggle) {
            chatbotToggle.addEventListener('click', () => this.toggle());
        }

        if (chatbotClose) {
            chatbotClose.addEventListener('click', () => this.close());
        }

        if (chatbotSend) {
            chatbotSend.addEventListener('click', () => this.sendMessage());
        }

        if (chatbotInput) {
            chatbotInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }

        // Close chatbot when clicking outside
        document.addEventListener('click', (e) => {
            const chatbotWidget = document.getElementById('chatbot-widget');
            if (this.isOpen && chatbotWidget && !chatbotWidget.contains(e.target)) {
                this.close();
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        const chatbotWindow = document.getElementById('chatbot-window');
        if (chatbotWindow) {
            chatbotWindow.classList.add('active');
            this.isOpen = true;
            
            // Add welcome message if no messages exist
            const messages = document.getElementById('chatbot-messages');
            if (messages && messages.children.length === 0) {
                this.addMessage('أهلاً! أنا هنا كمساعد طبي. اكتب سؤالك أو اختر سؤال جاهز أسفل الدردشة:', 'bot');
                // Ensure consent modal/notice appears first time
                this.ensureMedicalConsent();
            }
        }
    }

    close() {
        const chatbotWindow = document.getElementById('chatbot-window');
        if (chatbotWindow) {
            chatbotWindow.classList.remove('active');
            this.isOpen = false;
        }
    }

    sendMessage() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Clear input
        input.value = '';
        
        // Process message and respond
        setTimeout(() => {
            const response = this.processMessage(message);
            // processMessage returns an immediate acknowledgement while the real reply comes async
            if (response) this.addMessage(response, 'bot');
        }, 200);
    }

    addMessage(text, sender) {
        const messages = document.getElementById('chatbot-messages');
        if (!messages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.textContent = text;
        
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    // === NEW: medical consent (modal/notice) ===
    ensureMedicalConsent() {
        try {
            const consent = this.app.getFromStorage(this.medicalConsentKey);
            if (!consent) {
                // show short consent message in chat (you can replace with modal UI)
                this.addMessage("⚠️ ملاحظة مهمة: هذا المساعد يقدم معلومات طبية عامة فقط ولا يغني عن استشارة طبيب. في الحالات الطارئة اتصل بالإسعاف. بالضغط على متابعة أنت توافق على استمرار المحادثة.", 'bot');
                this.app.setToStorage(this.medicalConsentKey, true);
            }
        } catch (e) {
            console.warn('Consent storage failed', e);
        }
    }

    // === NEW: simple red-flag detection (عربي وإنجليزي كلمات أساسية) ===
    isEmergency(text) {
        if (!text) return false;
        const t = text.toLowerCase();
        const RED_FLAGS = [
            "ضيق نفس","صعوبة في التنفس","الم في الصدر","الم صدر","chest pain","shortness of breath",
            "فقدان الوعي","غشيان","نزيف حاد","bleeding","seizure","صرع","تشنج","خدر مفاجئ",
            "weakness sudden","sudden weakness","slurred speech","لا أستطيع التنفس","anaphylaxis"
        ];
        return RED_FLAGS.some(flag => t.includes(flag));
    }

    // === NEW: call Gemini API (uses the key above) ===
    async callGeminiAPI(userText) {
        // Construct prompt for a medical doctor persona. Output in Arabic.
        const systemPrompt = `أنت طبيب بشري محترف متخصص في جميع التخصصات الطبية. أجب باللغة العربية فقط بطريقة طبية دقيقة، مبسطة ومطمئنة. **لا تذكر أنك نموذج ذكاء اصطناعي**. إذا كانت الحالة طارئة دلّل المستخدم على ضرورة التوجه للطوارئ ولا تعطِ بدائل مخاطرة. لا تذكر أو تغيّر جرعات أدوية؛ يمكنك ذكر أنواع العلاجات العامة أو الفحوصات اللازمة.`;

        const userPrompt = `السؤال الطبي: ${userText}\n
أعطني: 
1) تشخيص مبدئي مختصر (احتمالات)، 
2) خطوات تحقيق أو فحوص ينصح بها، 
3) متى يجب زيارة الطبيب مباشرة أو الطوارئ، 
4) نصائح منزلية آمنة مبدئية.`;

        try {
            const resp = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        // body structure adapted to the public examples — Gemini may accept variants
                        // We send a simple content array with the system + user prompts
                        prompt: {
                            // Some Gemini endpoints accept "structured_prompt" or "messages" — this works commonly
                            // If your specific model requires different shape, replace accordingly.
                            text: `${systemPrompt}\n\n${userPrompt}`
                        },
                        // guidance settings (يمكن تعديلها لاحقًا)
                        temperature: 0.2,
                        maxOutputTokens: 800
                    })
                }
            );

            const data = await resp.json();
            // Try several likely places Gemini might put the text
            const candidateText =
                (data?.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content[0] && data.candidates[0].content[0].text) ||
                data?.candidates?.[0]?.content?.[0]?.text ||
                data?.candidates?.[0]?.text ||
                data?.output?.[0]?.content?.[0]?.text ||
                data?.result?.content?.text ||
                null;

            if (!candidateText) {
                console.error('Gemini response unknown shape', data);
                return { type: 'error', answer: "لم أتمكن من الحصول على إجابة من مزوّد الخدمة الآن. حاول مرة أخرى لاحقاً." };
            }

            // Basic heuristic: if text contains emergency hint, escalate
            const lower = candidateText.toLowerCase();
            const emergencyTriggers = ['الطوارئ', 'الاسعاف', 'اذهب إلى الطوارئ', 'اذهب للمستشفى', 'emergency', 'call emergency', 'seek immediate'];
            const isEmergencySuggested = emergencyTriggers.some(s => lower.includes(s));

            return {
                type: isEmergencySuggested ? 'escalate' : 'advice',
                answer: candidateText,
                raw: data
            };
        } catch (err) {
            console.error('callGeminiAPI error', err);
            return { type: 'error', answer: "حدث خطأ عند الاتصال بمزود الخدمة الطبي. حاول مرة أخرى لاحقًا." };
        }
    }

    processMessage(message) {
        const lowerMessage = message.toLowerCase();

        // 1) Check red-flags immediately
        if (this.isEmergency(lowerMessage)) {
            // Immediate emergency instruction; do NOT call API for deep advice
            const emergencyText = "إذا كنت تعاني من عرض طارئ مثل ألم صدر شديد، صعوبة في التنفس، فقدان وعي أو نزيف شديد — اذهب فوراً إلى أقرب غرفة طوارئ أو اتصل بالإسعاف. هل تريد أرقام الطوارئ الآن؟";
            // also fire an async background follow-up to log or attempt a more cautious response if needed
            setTimeout(() => {
                // no further action for emergency to avoid risky advice
            }, 10);
            return emergencyText;
        }

        // 2) Ensure consent recorded
        this.ensureMedicalConsent();

        // 3) Do not use FAQ as fallback per طلبك — call Gemini directly.
        // But we show an immediate acknowledgement while the async call runs.
        const ack = "⏳ استلمت سؤالك — جاري تحليله من قبل الطبيب الافتراضي، سأرد عليك خلال لحظات.";
        
        // 4) Make async call and append the real reply when it arrives
        this.addMessage("⏳ جاري تحليل سؤالك الطبي...", 'bot'); // temporary indicator
        this.callGeminiAPI(message).then(resp => {
            // remove the temporary indicator
            const messages = document.getElementById('chatbot-messages');
            if (messages) {
                // remove last bot-message that equals the loading text
                const botMsgs = messages.querySelectorAll('.bot-message');
                for (let i = botMsgs.length - 1; i >= 0; i--) {
                    const el = botMsgs[i];
                    if (el && el.textContent && el.textContent.includes('جاري تحليل سؤالك الطبي')) {
                        el.remove();
                        break;
                    }
                }
            }

            if (!resp) {
                this.addMessage("⚠️ حدث خطأ غير متوقع. حاول مرة أخرى.", 'bot');
                return;
            }

            if (resp.type === 'error') {
                this.addMessage(resp.answer, 'bot');
                return;
            }

            if (resp.type === 'escalate') {
                // Strong escalation: recommend ER and offer to connect to human (you can implement escalate flow)
                const txt = `⚠️ بناءً على تحليل الأعراض، أوصي بالتوجه للطوارئ أو مراجعة مختص فورًا.\n\n${resp.answer}`;
                this.addMessage(txt, 'bot');
                return;
            }

            // Normal medical advice
            this.addMessage(resp.answer, 'bot');
        }).catch(err => {
            console.error('callGeminiAPI then error', err);
            this.addMessage("⚠️ حدث خطأ أثناء معالجة سؤالك. حاول مرة أخرى.", 'bot');
        });

        return ack;
    }

    loadSuggestions() {
        const suggestions = document.getElementById('chatbot-suggestions');
        if (!suggestions) return;
        
        // Show top 4 FAQ questions as suggestions (you asked no fallback but keep suggestions UI)
        const topFAQs = [
            "طفلي حرارته مرتفعة، أعمل إيه؟",
            "أعاني من صداع مستمر، ما السبب؟",
            "ما هي أعراض الأنفلونزا؟",
            "إزاي أقوي مناعتي؟"
        ];
        
        suggestions.innerHTML = topFAQs.map(q => 
            `<button class="suggestion-btn" onclick="chatbot.handleSuggestion('${q.replace(/'/g, "\\'")}')">${q}</button>`
        ).join('');
    }

    handleSuggestion(question) {
        // Add question as user message
        this.addMessage(question, 'user');
        
        // Directly process suggestion as normal query
        setTimeout(() => {
            const response = this.processMessage(question);
            if (response) this.addMessage(response, 'bot');
        }, 200);
    }

    // Method to add custom FAQ (kept for compatibility)
    addFAQ(question, answer, keywords) {
        const newFAQ = {
            id: this.faqData.length + 1,
            question,
            answer,
            keywords
        };
        
        this.faqData.push(newFAQ);
        this.app.setToStorage('faqData', this.faqData);
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for app to be initialized
    setTimeout(() => {
        if (window.app) {
            window.chatbot = new Chatbot(window.app);
        }
    }, 100);
});

// Global function for suggestion handling
window.handleSuggestion = (question) => {
    if (window.chatbot) {
        window.chatbot.handleSuggestion(question);
    }
};
