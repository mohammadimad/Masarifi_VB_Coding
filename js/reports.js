document.addEventListener("DOMContentLoaded", () => {
    // 1. Print Report Button
    const btnPrint = document.getElementById("btn-print-report");
    if (btnPrint) {
        btnPrint.addEventListener("click", () => {
            window.print();
        });
    }

    // 2. Add functionality for other UI buttons (like active tabs)
    const periodButtons = document.querySelectorAll(".flex.bg-surface-container-high button");
    periodButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            // Remove active classes from all buttons in the group
            periodButtons.forEach(b => {
                b.classList.remove("bg-surface-container-lowest", "text-primary", "shadow-sm", "font-semibold");
                b.classList.add("text-on-surface-variant", "hover:text-on-surface");
            });
            // Add active classes to the clicked button
            const clickedBtn = e.currentTarget;
            clickedBtn.classList.remove("text-on-surface-variant", "hover:text-on-surface");
            clickedBtn.classList.add("bg-surface-container-lowest", "text-primary", "shadow-sm", "font-semibold");
        });
    });

    // 3. Granularity Tabs (Monthly, Weekly, Yearly)
    const granularityButtons = document.querySelectorAll(".flex.bg-surface-container button");
    granularityButtons.forEach(btn => {
        // Exclude the print/download buttons that are also in a bg-surface-container, 
        // we'll filter by checking if they don't have icons
        if (!btn.querySelector('.material-symbols-outlined')) {
            btn.addEventListener("click", (e) => {
                const parent = e.currentTarget.parentElement;
                const siblings = parent.querySelectorAll("button");
                siblings.forEach(b => {
                    b.classList.remove("bg-surface-container-lowest", "text-primary", "shadow-sm");
                    b.classList.add("text-on-surface-variant", "hover:text-on-surface");
                });
                const clickedBtn = e.currentTarget;
                clickedBtn.classList.remove("text-on-surface-variant", "hover:text-on-surface");
                clickedBtn.classList.add("bg-surface-container-lowest", "text-primary", "shadow-sm");
            });
        }
    });
});
