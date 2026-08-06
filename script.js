

const API = "https://script.google.com/macros/s/AKfycbxjs-LGDfjJoIYos1XxfrsWUcNlNr7Qf4oapCDyCw_EQm11FVn6bTfdCZDEXhMsALf4cA/exec";

const whatsappNumbers = [
    "201157722335",
    "201206609790"
];

const FACEBOOK_LINK = "https://www.facebook.com/profile.php?id=61590549099190";
const CONTRACT_API =
    "https://script.google.com/macros/s/AKfycbwxIRNY5JIyjiBA4jUtlRX38JQzIzdOSOvcj-_T-iFRpssesGKLn_cCTQzMw3VNAJfg/exec";


/* ===========================
        Globals & Init
=========================== */

let currentStudent = null;
document
    .getElementById("btnList")
    .addEventListener("click", loadPlans);

/* ===========================
        Payment Plans
=========================== */

function generatePricePlans(price) {

    price = Number(price);

    return {

        plans: [

            [
                "سنوي",
                `${price.toLocaleString("ar-EG")} جنيه`,
                "دفعة واحدة"
            ],

            [
                "نصف سنوي",
                `${Math.round(price / 2).toLocaleString("ar-EG")} جنيه`,
                "دفعتان متساويتان"
            ],

            [
                "6 أشهر",
                `${Math.round(price / 6).toLocaleString("ar-EG")} جنيه شهريًا`,
                "بدون مقدم"
            ],

            [
                "8 أشهر (20٪ مقدم)",
                `${Math.round(price * 0.20).toLocaleString("ar-EG")} جنيه مقدم + ${Math.round(price * 0.80 / 8).toLocaleString("ar-EG")} جنيه شهريًا`,
                "8 أقساط شهرية"
            ],

            [
                "8 أشهر (30٪ مقدم)",
                `${Math.round(price * 0.30).toLocaleString("ar-EG")} جنيه مقدم + ${Math.round(price * 0.70 / 8).toLocaleString("ar-EG")} جنيه شهريًا`,
                "8 أقساط شهرية"
            ],

            [
                "8 أشهر (40٪ مقدم)",
                `${Math.round(price * 0.40).toLocaleString("ar-EG")} جنيه مقدم + ${Math.round(price * 0.60 / 8).toLocaleString("ar-EG")} جنيه شهريًا`,
                "8 أقساط شهرية"
            ]

        ],

        values: [
            "yearly",
            "half",
            "6months",
            "8months20",
            "8months30",
            "8months40"
        ]

    };

}
/* ===========================
        Load Student
=========================== */

async function loadPlans() {

    const id = document
        .getElementById("studentId")
        .value
        .trim();

    if (id === "") {

        alert("يرجى إدخال كود الطالب");
        return;

    }

    const button = document.getElementById("btnList");
    const loading = document.getElementById("loading");

    button.disabled = true;
    button.textContent = "جارٍ التحميل...";
    loading.style.display = "flex";

    try {

        const response = await fetch(
            API +
            "?id=" +
            encodeURIComponent(id) +
            "&t=" +
            Date.now(),
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!response.ok) {

            throw new Error("تعذر الاتصال بالخادم.");

        }

        const student = await response.json();
        currentStudent = student;

        switch (student.price) {

            case -1:
                alert("لم يتم تحديد الرسوم لهذا الطالب.");
                return;

            case -2:
                alert("هناك مشكلة في قيمة الرسوم برجاء التواصل مع دعم خدمة العملاء في اقرب وقت.");
                return;

            case -3:
                alert("هناك مشكلة في قيمة الرسوم برجاء التواصل مع دعم خدمة العملاء في اقرب وقت.");
                return;

            case -4:
                alert("هناك مشكلة في قيمة الرسوم برجاء التواصل مع دعم خدمة العملاء في اقرب وقت.");
                return;

        }

        // Student Information

        document.getElementById("studentName").textContent =
            student.studentName;

        document.getElementById("studentSchool").textContent =
            student.school;

        document.getElementById("studentLocation").textContent =
            student.location;

        // Plans
        const result = generatePricePlans(student.price);

        const plans = result.plans;
        const values = result.values;

        const tbody = document.getElementById("plansTable");
        tbody.innerHTML = "";

        const select = document.getElementById("planSelect");
        select.innerHTML = "";

        plans.forEach((plan, i) => {

            tbody.innerHTML += `
                <tr>
                    <td>${plan[0]}</td>
                    <td>${plan[1]}</td>
                    <td>${plan[2]}</td>
                </tr>
            `;

            select.innerHTML += `
                <option value="${values[i]}">
                    ${plan[0]}
                </option>
            `;

        });

        document
            .getElementById("result")
            .style
            .display = "block";

    }
    catch (error) {

        console.error(error);

        alert(
            "حدث خطأ أثناء الاتصال بالخادم."
        );

    }
    finally {

        button.disabled = false;
        button.textContent = "عرض خطط السداد";
        loading.style.display = "none";

    }

}

/* ===========================
    Download Contract
=========================== */

document
    .getElementById("btnDownload")
    .addEventListener("click", () => {

        downloadContract();

    });

async function downloadContract() {

    if (!currentStudent) {

        alert("يرجى البحث عن الطالب أولاً.");
        return;

    }

    let plan = document.getElementById("planSelect").value;

    let percent = 0;

    switch (plan) {

        case "8months20":
            plan = "8months";
            percent = 20;
            break;

        case "8months30":
            plan = "8months";
            percent = 30;
            break;

        case "8months40":
            plan = "8months";
            percent = 40;
            break;

    }

    const button = document.getElementById("btnDownload");

    button.disabled = true;
    button.textContent = "جارٍ إنشاء العقد...";

    try {

        const response = await fetch(
            CONTRACT_API +
            "?price=" + encodeURIComponent(currentStudent.price) +
            "&percent=" + encodeURIComponent(percent) +
            "&plan=" + encodeURIComponent(plan) +
            "&t=" + Date.now(),
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error("Server Error");
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error);
        }

        window.open(data.url, "_blank");

    }
    catch (err) {

        console.error(err);
        alert("حدث خطأ أثناء إنشاء العقد.");

    }
    finally {

        button.disabled = false;
        button.textContent = "تحميل العقد";

    }

}

    
/* ===========================
    Contact
=========================== */

function getRepresentativeIndex(studentId) {

    let hash = 0;

    for (const c of studentId) {
        hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
    }

    return hash % whatsappNumbers.length;

}

document
    .getElementById("btnWhatsapp")
    .addEventListener("click", () => {

        const id = document
            .getElementById("studentId")
            .value
            .trim();

        const index = getRepresentativeIndex(id);

        let message = "";

        message += `مرحبًا، لدي استفسار بخصوص خطط السداد.`;

        if (currentStudent) {
            message += `\n\nكود الطالب: ${id}`;
            message += `\nاسم الطالب: ${currentStudent.studentName}`;
            message +=  '\n';
        }

        window.open(
            `https://wa.me/${whatsappNumbers[index]}?text=${encodeURIComponent(message)}`,
            "_blank"
        );

    });

document
    .getElementById("btnFacebook")
    .addEventListener("click", () => {

        window.open(
            FACEBOOK_LINK,
            "_blank"
        );

    });