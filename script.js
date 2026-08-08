

const API = "https://script.google.com/macros/s/AKfycbxjs-LGDfjJoIYos1XxfrsWUcNlNr7Qf4oapCDyCw_EQm11FVn6bTfdCZDEXhMsALf4cA/exec";

const whatsappNumbers = [
    "201157722335",
    "201206609790"
];

const FACEBOOK_LINK = "https://www.facebook.com/profile.php?id=61590549099190";
const CONTRACT_API =
    "https://script.google.com/macros/s/AKfycbziYvuDg0NE2Z8ttQY2GsO1YvDxE9gMB4AqlR9BEF-WGi1LaRaS-77I-RqUYc0gHncutQ/exec";

const idPattern = /^2627\d{2,3}$/;

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
                `${price} جنيه`,
                "دفعة واحدة"
            ],

            [
                "نصف سنوي",
                `${Math.round(price / 2)} جنيه`,
                "دفعتان متساويتان"
            ],

            [
                "6 أشهر",
                `${Math.round(price / 6)} جنيه شهريًا`,
                "بدون مقدم"
            ],

            [
                "7 أشهر (20٪ مقدم)",
                `${Math.round(price * 0.20)} جنيه مقدم <br> ${Math.round(price * 0.80 / 7)} جنيه شهريًا`,
                "7 أقساط شهرية"
            ],

            [
                "7 أشهر (30٪ مقدم)",
                `${Math.round(price * 0.30)} جنيه مقدم <br> ${Math.round(price * 0.70 / 7)} جنيه شهريًا`,
                "7 أقساط شهرية"
            ],

            [
                "7 أشهر (40٪ مقدم)",
                `${Math.round(price * 0.40)} جنيه مقدم <br> ${Math.round(price * 0.60 / 7)} جنيه شهريًا`,
                "7 أقساط شهرية"
            ]

        ],

        values: [
            "yearly",
            "half",
            "6months",
            "7months20",
            "7months30",
            "7months40"
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
        .trim()
        .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

    if (id === "") {
        showWarning("يرجى إدخال كود الطالب");
        return;

    }

    if (!idPattern.test(id)) {
        showWarning(
            "يرجى إدخال كود طالب صحيح.\n\n" +
            "يجب أن يبدأ بـ 2627 ويتكون من 6 أو 7 أرقام فقط.\n\n" +
            "أمثلة:\n262708\n2627123"
        );
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
        student.id = id;
        
        currentStudent = student;


        if(student.price == -5) {
            showWarning("لم يتم العثور على الطالب تأكد من أن الكود صحيح");
            return;
        }

        switch (student.price) {

            case -1:
                showWarning("لم يتم تحديد رسوم لهذا الطالب, إذا كنت تعتقد ان هناك خطأ توصل مع الدعم.");
                return;

            case -2:
                showError("هناك مشكلة في قيمة الرسوم برجاء التواصل مع دعم خدمة العملاء في اقرب وقت.");
                return;

            case -3:
                showError("هناك مشكلة في قيمة الرسوم برجاء التواصل مع دعم خدمة العملاء في اقرب وقت.");
                return;

            case -4:
                showError("هناك مشكلة في قيمة الرسوم برجاء التواصل مع دعم خدمة العملاء في اقرب وقت.");
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

        showError(
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

        showWarning("يرجى البحث عن الطالب أولاً.");
        return;

    }

    console.log(currentStudent);

        
    let plan = document.getElementById("planSelect").value;

    let percent = 0;

    switch (plan) {

        case "7months20":
            plan = "7months";
            percent = 20;
            break;

        case "7months30":
            plan = "7months";
            percent = 30;
            break;

        case "7months40":
            plan = "7months";
            percent = 40;
            break;

    }

    const button = document.getElementById("btnDownload");

    button.disabled = true;
    button.textContent = "جارٍ إنشاء العقد...";
    document.getElementById("downloadLoading").style.display = "flex";

    try {

        const response = await fetch(
            CONTRACT_API +
            "?price=" + encodeURIComponent(currentStudent.price) +
            "&percent=" + encodeURIComponent(percent) +
            "&plan=" + encodeURIComponent(plan) +
            "&studentId=" + encodeURIComponent(currentStudent.id) +
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

        const a = document.createElement("a");
        a.href = data.url;
        a.click();

    }
    catch (err) {

        console.error(err);
        showError("حدث خطأ أثناء إنشاء العقد.");

    }
    finally {

        button.disabled = false;
        button.textContent = "تحميل العقد";
        document.getElementById("downloadLoading").style.display = "none";
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

        const index = getRepresentativeIndex(currentStudent.id);

        let message = "";

        message += `مرحبًا، لدي استفسار بخصوص خطط السداد.`;

        if (currentStudent) {
            message += `\n\nكود الطالب: ${currentStudent.id}`;
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


function showAlert(type, message) {

    const title = document.getElementById("customAlertTitle");
    const icon = document.getElementById("customAlertIcon");
    const button = document.getElementById("customAlertButton");

    switch (type) {

        case "success":
            title.textContent = "Success";
            icon.textContent = "✅";
            icon.style.color = "#28a745";
            button.style.background = "#28a745";
            break;

        case "warning":
            title.textContent = "Warning";
            icon.textContent = "⚠️";
            icon.style.color = "#f0ad4e";
            button.style.background = "#f0ad4e";
            break;

        case "error":
            title.textContent = "Error";
            icon.textContent = "❌";
            icon.style.color = "#dc3545";
            button.style.background = "#dc3545";
            break;
    }

    document.getElementById("customAlertMessage").textContent = message;
    document.getElementById("customAlert").style.display = "flex";
}

function closeAlert() {
    document.getElementById("customAlert").style.display = "none";
}

function showConfirmation(message) {
    showAlert("success", message);
}

function showWarning(message) {
    showAlert("warning", message);
}

function showError(message) {
    showAlert("error", message);
}