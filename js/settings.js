/**
 * Masarifi - Settings Page Frontend Logic
 * Strictly Vanilla JS (Frontend-only, no database connection)
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Tab Switching & Scroll Sync
  const tabButtons = document.querySelectorAll(".tab-btn");
  const panels = [
    document.getElementById("profile-panel"),
    document.getElementById("financial-panel"),
    document.getElementById("notifications-panel"),
    document.getElementById("security-panel"),
    document.getElementById("danger-panel")
  ].filter(Boolean);

  function setActiveTab(targetId) {
    tabButtons.forEach(btn => {
      const onclickAttr = btn.getAttribute("onclick") || "";
      if (onclickAttr.includes(targetId)) {
        btn.classList.add("bg-surface-container-lowest", "text-primary", "shadow-sm");
        btn.classList.remove("text-on-surface-variant");
      } else {
        btn.classList.remove("bg-surface-container-lowest", "text-primary", "shadow-sm");
        btn.classList.add("text-on-surface-variant");
      }
    });
  }

  // Intercept tab button clicks for smooth experience
  tabButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const onclickAttr = btn.getAttribute("onclick") || "";
      const match = onclickAttr.match(/'([^']+)'/);
      if (match && match[1]) {
        const targetId = match[1];
        const panel = document.getElementById(targetId);
        if (panel) {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
          setActiveTab(targetId);
        }
      }
    });
  });

  // 2. Budget Alert Threshold Slider
  const thresholdSlider = document.querySelector('input[type="range"]');
  const thresholdVal = document.getElementById("threshold-val");
  if (thresholdSlider && thresholdVal) {
    thresholdSlider.addEventListener("input", (e) => {
      thresholdVal.textContent = `${e.target.value}% من إجمالي الميزانية`;
    });
  }

  // 3. Save Notification Toast
  const saveBtn = document.getElementById("save-btn");
  const saveToast = document.getElementById("save-toast");
  let toastTimer = null;

  if (saveBtn && saveToast) {
    saveBtn.addEventListener("click", () => {
      clearTimeout(toastTimer);
      saveToast.classList.remove("hidden");
      saveToast.classList.add("flex");
      
      toastTimer = setTimeout(() => {
        saveToast.classList.add("hidden");
        saveToast.classList.remove("flex");
      }, 4000);
    });
  }

  // 4. Cancel Changes Button
  const cancelBtn = document.querySelector('button[type="button"]:has(span:contains("إلغاء التعديلات"))') ||
                   Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("إلغاء التعديلات"));
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      if (confirm("هل تريد التراجع عن التغييرات غير المحفوظة؟")) {
        window.location.reload();
      }
    });
  }

  // 5. Danger Zone Confirmation
  const resetBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("تصفير العمليات"));
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      confirm("تحذير: هل أنت متأكد من رغبتك في تصفير كافة العمليات والحركات المالية؟");
    });
  }

  const deleteAccountBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("حذف الحساب"));
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", () => {
      confirm("تحذير أخير: هل أنت متأكد من رغبتك في حذف الحساب نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.");
    });
  }

  // 6. Avatar Upload Demo
  const uploadAvatarBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("رفع صورة جديدة"));
  const removeAvatarBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("إزالة"));
  const avatarImg = document.querySelector("#profile-panel img");

  if (uploadAvatarBtn) {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    uploadAvatarBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file && avatarImg) {
        const reader = new FileReader();
        reader.onload = (event) => {
          avatarImg.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (removeAvatarBtn && avatarImg) {
    removeAvatarBtn.addEventListener("click", () => {
      if (confirm("هل تريد إزالة صورة الملف الشخصي؟")) {
        avatarImg.src = "https://ui-avatars.com/api/?name=User&background=3525cd&color=fff";
      }
    });
  }
});
