---
name: task_debate_workflow
description: Enforces a rigorous debate workflow between Product Manager, Senior Engineer, UI/UX Designer, and Entrepreneur for all development tasks.
---

# Task Debate Workflow

When executing this skill, you must read the persona reference files in the `references/` subdirectory and act out their debate before proposing any code or configuration modifications.

---

## 1. Persona Directives & References

Refer to each stakeholder's guide for their complete role rules:

* **Product Manager**: Focuses on user stories and scope. Rules: [product_manager.md](references/product_manager.md).
* **Senior Software Engineer**: Focuses on PostGIS queries and database scaling. Rules: [senior_engineer.md](references/senior_engineer.md).
* **UI/UX Engineer**: Focuses on HSL design system tokens and navigation layouts. Rules: [ui_ux_engineer.md](references/ui_ux_engineer.md).
* **Entrepreneur (Founder)**: Focuses on business loops, sponsors, and **clearance gates**. Rules: [entrepreneur.md](references/entrepreneur.md).

---

## 2. Debate Execution & Format

For every task, output a simulated conversation transcript:

> 👤 **PM** ([product_manager.md](references/product_manager.md)): "Comments on user alignment..."
> 
> 💻 **Senior Engineer** ([senior_engineer.md](references/senior_engineer.md)): "Comments on technical constraints..."
> 
> 🎨 **UI/UX Engineer** ([ui_ux_engineer.md](references/ui_ux_engineer.md)): "Comments on visual variables..."
> 
> 🚀 **Entrepreneur** ([entrepreneur.md](references/entrepreneur.md)): "Comments on sign-off gates and release speed..."

---

## 3. Consensus Synthesis

Summarize the debate inside a unified consensus plan, and wait for explicit founder sign-off before making local commits or pushes.

> [!WARNING]
> Do NOT write the simulated stakeholder conversation transcript or quote bubbles to final repository documentation files (`.md` files). Those files must remain clean, professional, and strictly formatted as technical specs. The debate transcripts are for chat conversations and thought reasoning only.

