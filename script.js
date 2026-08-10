
const API = "https://script.google.com/macros/s/AKfycbxjs-LGDfjJoIYos1XxfrsWUcNlNr7Qf4oapCDyCw_EQm11FVn6bTfdCZDEXhMsALf4cA/exec";
const CONTRACT_API = "https://script.google.com/macros/s/AKfycbziYvuDg0NE2Z8ttQY2GsO1YvDxE9gMB4AqlR9BEF-WGi1LaRaS-77I-RqUYc0gHncutQ/exec";
const idPattern = /^2627\d{2,3}$/;

let currentStudent = null;

function generatePricePlans(price) {
    price = Number(price);

    return {
        plans: [
            ["سنوي", `${price} جنيه`, "دفعة واحدة"],
            ["نصف سنوي", `${Math.round(price / 2)} جنيه`, "دفعتان متساويتان"],
            ["6 أشهر", `${Math.round(price / 6)} جنيه شهريًا`, "بدون مقدم"],
            ["7 أشهر (20٪ مقدم)", `${Math.round(price * 0.2)} جنيه مقدم <br> ${Math.round((price * 0.8) / 7)} جنيه شهريًا`, "7 أقساط شهرية"],
            ["7 أشهر (30٪ مقدم)", `${Math.round(price * 0.3)} جنيه مقدم <br> ${Math.round((price * 0.7) / 7)} جنيه شهريًا`, "7 أقساط شهرية"],
            ["7 أشهر (40٪ مقدم)", `${Math.round(price * 0.4)} جنيه مقدم <br> ${Math.round((price * 0.6) / 7)} جنيه شهريًا`, "7 أقساط شهرية"]
        ],
        values: ["yearly", "half", "6months", "7months20", "7months30", "7months40"]
    };
}

document.addEventListener("DOMContentLoaded", () => {
    const btnList = document.getElementById("btnList");
    if (btnList) {
        btnList.addEventListener("click", loadPlans);
    }

    const btnDownload = document.getElementById("btnDownload");
    if (btnDownload) {
        btnDownload.addEventListener("click", downloadContract);
    }

    const closeButton = document.getElementById("customAlertButton");
    if (closeButton) {
        closeButton.addEventListener("click", closeAlert);
    }
});

async function loadPlans() {
    const id = document.getElementById("studentId")
        .value
        .trim()
        .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

    if (id === "") {
        showWarning("يرجى إدخال كود الطالب");
        return;
    }

    if (!idPattern.test(id)) {
        showWarning("يرجى إدخال كود طالب صحيح.\n\nيجب أن يبدأ بـ 2627 ويتكون من 6 أو 7 أرقام فقط.\n\nأمثلة:\n262708\n2627123");
        return;
    }

    const button = document.getElementById("btnList");
    const loading = document.getElementById("loading");

    if (button) {
        button.disabled = true;
        button.textContent = "جارٍ التحميل...";
    }

    if (loading) {
        loading.style.display = "flex";
    }

    try {
        const response = await fetch(`${API}?id=${encodeURIComponent(id)}&t=${Date.now()}`, {
            method: "GET",
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("تعذر الاتصال بالخادم.");
        }

        const student = await response.json();
        student.id = id;
        currentStudent = student;

        if (student.price === -5) {
            showWarning("لم يتم العثور على الطالب تأكد من أن الكود صحيح");
            return;
        }

        switch (student.price) {
            case -1:
                showWarning("لم يتم تحديد رسوم لهذا الطالب، إذا كنت تعتقد أن هناك خطأ توصل مع الدعم.");
                return;
            case -2:
            case -3:
            case -4:
                showError("هناك مشكلة في قيمة الرسوم برجاء التواصل مع دعم خدمة العملاء في أقرب وقت.");
                return;
        }

        document.getElementById("studentName").textContent = student.studentName;
        document.getElementById("studentSchool").textContent = student.school;
        document.getElementById("studentLocation").textContent = student.location;

        const result = generatePricePlans(student.price);
        const tbody = document.getElementById("plansTable");
        const select = document.getElementById("planSelect");
        const resultCard = document.getElementById("result");

        if (tbody) {
            tbody.innerHTML = "";
        }

        if (select) {
            select.innerHTML = "";
        }

        result.plans.forEach((plan, i) => {
            if (tbody) {
                tbody.innerHTML += `
                    <tr>
                        <td>${plan[0]}</td>
                        <td>${plan[1]}</td>
                        <td>${plan[2]}</td>
                    </tr>`;
            }

            if (select) {
                select.innerHTML += `<option value="${result.values[i]}">${plan[0]}</option>`;
            }
        });

        if (resultCard) {
            resultCard.style.display = "block";
        }
    } catch (error) {
        console.error(error);
        showError("حدث خطأ أثناء الاتصال بالخادم.");
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "عرض خطط السداد";
        }

        if (loading) {
            loading.style.display = "none";
        }
    }
}

async function downloadContract() {
    if (!currentStudent) {
        showWarning("يرجى البحث عن الطالب أولاً.");
        return;
    }

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

    if (button) {
        button.disabled = true;
        button.textContent = "جارٍ إنشاء العقد...";
    }

    const loading = document.getElementById("downloadLoading");
    if (loading) {
        loading.style.display = "flex";
    }

    try {
        const response = await fetch(
            `${CONTRACT_API}?price=${encodeURIComponent(currentStudent.price)}&percent=${encodeURIComponent(percent)}&plan=${encodeURIComponent(plan)}&studentId=${encodeURIComponent(currentStudent.id)}&t=${Date.now()}`,
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
            throw new Error(data.error || "حدث خطأ أثناء إنشاء العقد.");
        }

        const a = document.createElement("a");
        a.href = data.url;
        a.click();
    } catch (error) {
        console.error(error);
        showError("حدث خطأ أثناء إنشاء العقد.");
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "تحميل العقد";
        }

        if (loading) {
            loading.style.display = "none";
        }
    }
}

function showAlert(type, message) {
    const title = document.getElementById("customAlertTitle");
    const icon = document.getElementById("customAlertIcon");
    const button = document.getElementById("customAlertButton");
    const overlay = document.getElementById("customAlert");

    if (!title || !icon || !button || !overlay) {
        return;
    }

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
    overlay.style.display = "flex";
}

function closeAlert() {
    const overlay = document.getElementById("customAlert");
    if (overlay) {
        overlay.style.display = "none";
    }
}

function showWarning(message) {
    showAlert("warning", message);
}

function showError(message) {
    showAlert("error", message);
}