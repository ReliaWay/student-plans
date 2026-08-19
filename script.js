const API = "https://script.google.com/macros/s/AKfycbxjs-LGDfjJoIYos1XxfrsWUcNlNr7Qf4oapCDyCw_EQm11FVn6bTfdCZDEXhMsALf4cA/exec";

const CONTRACT_API = "https://script.google.com/macros/s/AKfycbziYvuDg0NE2Z8ttQY2GsO1YvDxE9gMB4AqlR9BEF-WGi1LaRaS-77I-RqUYc0gHncutQ/exec";

const idPattern = /^2627\d{2,3}$/;

let currentStudent = null;


// ============================================================
// PLAN RULES
// ============================================================

const bundleRules = [
    { key: "yearly",         months: 1, advance: false },
    { key: "6months",        months: 6, advance: false },
    { key: "7months",        months: 7, advance: false },
    { key: "8months",        months: 8, advance: false },
    { key: "9months",        months: 9, advance: false },

    { key: "halfYearly",     months: 2, advance: false },

    { key: "6monthsAdvance", months: 6, advance: true },
    { key: "7monthsAdvance", months: 7, advance: true },
    { key: "8monthsAdvance", months: 8, advance: true },
    { key: "9monthsAdvance", months: 9, advance: true }
];


// ============================================================
// ADVANCE PERCENTAGES
// ============================================================

const advancePercentages = [20, 30, 40];


// ============================================================
// PRICE PLAN GENERATOR
// ============================================================

function generatePricePlans(price, bundles, priceType) {

    price = Number(price);

    const plans = [];
    const values = [];

    const isMonthly =
        priceType === "تكلفه الشهر";


    bundleRules.forEach(rule => {

        // ====================================================
        // MONTHLY PRICE MODE
        // ====================================================

        if (isMonthly) {

            // No yearly
            if (rule.key === "yearly") {
                return;
            }

            // No half yearly
            if (rule.key === "halfYearly") {
                return;
            }

            // No advance plans
            if (rule.advance) {
                return;
            }
        }


        // ====================================================
        // CHECK AVAILABILITY
        // ====================================================

        if (
            !bundles ||
            !bundles[rule.key] ||
            bundles[rule.key].available !== true
        ) {
            return;
        }


        const name =
            bundles[rule.key].name;


        // ====================================================
        // ADVANCE PLANS
        // ====================================================

        if (rule.advance) {

            advancePercentages.forEach(percent => {

                const initial =
                    Math.round(
                        price * percent / 100
                    );

                const monthly =
                    Math.round(
                        ((price - initial) / rule.months)
                    );


                plans.push([
                    `${name} (${percent}% مقدم)`,

                    `${initial} جنيه تقريباً مقدم <br>` +
                    `${monthly} جنيه تقريباً شهريًا`,

                    `${rule.months} أقساط شهرية`
                ]);


                values.push(
                    `${rule.key}_${percent}`
                );

            });

            return;
        }


        // ====================================================
        // YEARLY
        // ====================================================

        if (rule.key === "yearly") {

            plans.push([
                name,
                `${price} جنيه تقريباً`,
                "دفعة واحدة"
            ]);

            values.push(
                rule.key
            );

            return;
        }


        // ====================================================
        // HALF YEARLY
        // ====================================================

        if (rule.key === "halfYearly") {

            const installment =
                Math.round(price / 2);

            plans.push([
                name,
                `${installment} جنيه تقريباً`,
                "دفعتان متساويتان"
            ]);

            values.push(
                rule.key
            );

            return;
        }


        // ====================================================
        // NORMAL MONTHLY PLANS
        // ====================================================

        let monthly;

        if (isMonthly) {

            // The price itself is the monthly price
            monthly = price;

        }
        else {

            // The price is the total/yearly price
            monthly =
                Math.round(
                    price / rule.months
                );

        }


        plans.push([
            name,
            `${monthly} جنيه تقريباً شهريًا`,
            `${rule.months} أقساط شهرية`
        ]);


        values.push(
            rule.key
        );

    });


    return {
        plans: plans,
        values: values
    };
}


// ============================================================
// DOM READY
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    const btnList =
        document.getElementById("btnList");

    if (btnList) {

        btnList.addEventListener(
            "click",
            loadPlans
        );

    }


    const btnDownload =
        document.getElementById("btnDownload");

    if (btnDownload) {

        btnDownload.addEventListener(
            "click",
            downloadContract
        );

    }


    const closeButton =
        document.getElementById(
            "customAlertButton"
        );

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeAlert
        );

    }

});


// ============================================================
// LOAD PLANS
// ============================================================

async function loadPlans() {

    const id =
        document.getElementById("studentId")
            .value
            .trim()
            .replace(
                /[٠-٩]/g,
                d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)
            );


    // ========================================================
    // EMPTY ID
    // ========================================================

    if (id === "") {

        showWarning(
            "يرجى إدخال كود الطالب"
        );

        return;
    }


    // ========================================================
    // INVALID ID
    // ========================================================

    if (!idPattern.test(id)) {

        showWarning(
            "يرجى إدخال كود طالب صحيح.\n\n" +
            "يجب أن يبدأ بـ 2627 ويتكون من 6 أو 7 أرقام فقط.\n\n" +
            "أمثلة:\n" +
            "262708\n" +
            "2627123"
        );

        return;
    }


    const button =
        document.getElementById("btnList");

    const loading =
        document.getElementById("loading");


    if (button) {

        button.disabled = true;

        button.textContent =
            "جارٍ التحميل...";

    }


    if (loading) {

        loading.style.display =
            "flex";

    }


    try {

        // ====================================================
        // REQUEST STUDENT
        // ====================================================

        const response =
            await fetch(
                `${API}?id=${encodeURIComponent(id)}&t=${Date.now()}`,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "تعذر الاتصال بالخادم."
            );

        }


        const student =
            await response.json();


        student.id = id;

        currentStudent = student;


        // ====================================================
        // STUDENT NOT FOUND
        // ====================================================

        if (student.price === -5) {

            showWarning(
                "لم يتم العثور على الطالب تأكد من أن الكود صحيح"
            );

            return;
        }


        // ====================================================
        // PRICE ERRORS
        // ====================================================

        switch (student.price) {

            case -1:

                showWarning(
                    "لم يتم تحديد رسوم لهذا الطالب، إذا كنت تعتقد أن هناك خطأ توصل مع الدعم."
                );

                return;


            case -2:
            case -3:
            case -4:

                showError(
                    "هناك مشكلة في قيمة الرسوم برجاء التواصل مع دعم خدمة العملاء في أقرب وقت."
                );

                return;

        }


        // ====================================================
        // STUDENT INFORMATION
        // ====================================================

        const studentName =
            document.getElementById(
                "studentName"
            );

        if (studentName) {

            studentName.textContent =
                student.studentName;

        }


        const studentSchool =
            document.getElementById(
                "studentSchool"
            );

        if (studentSchool) {

            studentSchool.textContent =
                student.school;

        }


        const studentLocation =
            document.getElementById(
                "studentLocation"
            );

        if (studentLocation) {

            studentLocation.textContent =
                student.location;

        }


        // ====================================================
        // GENERATE ALLOWED PLANS
        // ====================================================

        const result =
            generatePricePlans(
                student.price,
                student.bundles,
                student.priceType
            );


        const tbody =
            document.getElementById(
                "plansTable"
            );


        const select =
            document.getElementById(
                "planSelect"
            );


        const resultCard =
            document.getElementById(
                "result"
            );


        if (tbody) {

            tbody.innerHTML = "";

        }


        if (select) {

            select.innerHTML = "";

        }


        // ====================================================
        // NO AVAILABLE PLANS
        // ====================================================

        if (result.plans.length === 0) {

            showWarning(
                "لا توجد خطط سداد متاحة لهذا الطالب."
            );

            return;
        }


        // ====================================================
        // DISPLAY PLANS
        // ====================================================

        result.plans.forEach(
            (plan, i) => {

                if (tbody) {

                    tbody.innerHTML += `
                        <tr>
                            <td>${plan[0]}</td>
                            <td>${plan[1]}</td>
                            <td>${plan[2]}</td>
                        </tr>
                    `;

                }


                if (select) {

                    select.innerHTML += `
                        <option value="${result.values[i]}">
                            ${plan[0]}
                        </option>
                    `;

                }

            }
        );


        // ====================================================
        // SHOW RESULT
        // ====================================================

        if (resultCard) {

            resultCard.style.display =
                "block";

        }


    } catch (error) {

        console.error(error);

        showError(
            "حدث خطأ أثناء الاتصال بالخادم."
        );


    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "عرض خطط السداد";

        }


        if (loading) {

            loading.style.display =
                "none";

        }

    }

}


// ============================================================
// DOWNLOAD CONTRACT
// ============================================================

async function downloadContract() {

    if (!currentStudent) {

        showWarning(
            "يرجى البحث عن الطالب أولاً."
        );

        return;
    }


    // ========================================================
    // SELECTED VALUE
    // ========================================================

    const selectedValue =
        document.getElementById(
            "planSelect"
        ).value;


    // ========================================================
    // PLAN + PERCENT
    // ========================================================

    let plan =
        selectedValue;

    let percent = 0;


    const advanceMatch =
        selectedValue.match(
            /^(6monthsAdvance|7monthsAdvance|8monthsAdvance|9monthsAdvance)_(20|30|40)$/
        );


    if (advanceMatch) {

        plan =
            advanceMatch[1];

        percent =
            Number(advanceMatch[2]);

    }


    // ========================================================
    // CHECK BACKEND AVAILABILITY AGAIN
    // ========================================================

    if (
        !currentStudent.bundles ||
        !currentStudent.bundles[plan] ||
        currentStudent.bundles[plan].available !== true
    ) {

        showWarning(
            "خطة السداد هذه غير متاحة لهذا الطالب."
        );

        return;
    }


    // ========================================================
    // CALCULATE CONTRACT PRICE
    // ========================================================

    let contractPrice =
        Number(currentStudent.price);


    if (
        currentStudent.priceType === "تكلفه الشهر"
    ) {

        // Only normal monthly plans can exist
        // in monthly price mode.

        const monthsMatch =
            plan.match(
                /^(\d+)months$/
            );


        if (!monthsMatch) {

            showError(
                "خطة السداد غير صالحة."
            );

            return;
        }


        const months =
            Number(monthsMatch[1]);


        contractPrice =
            contractPrice * months;

    }


    // ========================================================
    // DOWNLOAD BUTTON
    // ========================================================

    const button =
        document.getElementById(
            "btnDownload"
        );


    if (button) {

        button.disabled = true;

        button.textContent =
            "جارٍ إنشاء العقد...";

    }


    const loading =
        document.getElementById(
            "downloadLoading"
        );


    if (loading) {

        loading.style.display =
            "flex";

    }


    try {

        // ====================================================
        // REQUEST CONTRACT
        // ====================================================

        const response =
            await fetch(

                `${CONTRACT_API}` +
                `?price=${encodeURIComponent(contractPrice)}` +
                `&percent=${encodeURIComponent(percent)}` +
                `&plan=${encodeURIComponent(plan)}` +
                `&studentId=${encodeURIComponent(currentStudent.id)}` +
                `&t=${Date.now()}`,

                {
                    method: "GET",
                    cache: "no-store"
                }

            );


        if (!response.ok) {

            throw new Error(
                "Server Error"
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.error ||
                "حدث خطأ أثناء إنشاء العقد."
            );

        }


        // ====================================================
        // DOWNLOAD
        // ====================================================

        const a =
            document.createElement("a");

        a.href =
            data.url;

        a.click();


    } catch (error) {

        console.error(error);

        showError(
            "حدث خطأ أثناء إنشاء العقد."
        );


    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "تحميل العقد";

        }


        if (loading) {

            loading.style.display =
                "none";

        }

    }

}


// ============================================================
// ALERT
// ============================================================

function showAlert(type, message) {

    const title =
        document.getElementById(
            "customAlertTitle"
        );

    const icon =
        document.getElementById(
            "customAlertIcon"
        );

    const button =
        document.getElementById(
            "customAlertButton"
        );

    const overlay =
        document.getElementById(
            "customAlert"
        );


    if (
        !title ||
        !icon ||
        !button ||
        !overlay
    ) {

        return;

    }


    switch (type) {

        case "success":

            title.textContent =
                "Success";

            icon.textContent =
                "✅";

            icon.style.color =
                "#28a745";

            button.style.background =
                "#28a745";

            break;


        case "warning":

            title.textContent =
                "Warning";

            icon.textContent =
                "⚠️";

            icon.style.color =
                "#f0ad4e";

            button.style.background =
                "#f0ad4e";

            break;


        case "error":

            title.textContent =
                "Error";

            icon.textContent =
                "❌";

            icon.style.color =
                "#dc3545";

            button.style.background =
                "#dc3545";

            break;

    }


    const messageElement =
        document.getElementById(
            "customAlertMessage"
        );


    if (messageElement) {

        messageElement.textContent =
            message;

    }


    overlay.style.display =
        "flex";

}


// ============================================================
// CLOSE ALERT
// ============================================================

function closeAlert() {

    const overlay =
        document.getElementById(
            "customAlert"
        );

    if (overlay) {

        overlay.style.display =
            "none";

    }

}


// ============================================================
// WARNING
// ============================================================

function showWarning(message) {

    showAlert(
        "warning",
        message
    );

}


// ============================================================
// ERROR
// ============================================================

function showError(message) {

    showAlert(
        "error",
        message
    );

}