# Trip Planner 🌴✈️

_A comprehensive, modern itinerary and travel management SaaS built for the **Cohort 26 Buildathon** by [ChaiCode](https://chaicode.com) (Cohort 2026)._

## 📖 1. Documentation

Trip Planner is an all-in-one travel management platform designed to take the stress out of group trips, solo adventures, and family vacations. It streamlines the whole process of trip planning from conception to execution.

**Key Features:**

- **Secure Authentication:** Client-side authentication guard backed by Appwrite, ensuring safe and reliable meer sessions.
- **Premium Dashboard Interface:** A highly visual, beautifully animated dashboard meing Framer Motion and GSAP, offering an intuitive "at-a-glance" view of upcoming trips, stats, and recent activities.
- **Interactive Itinerary Builder:** Plan activities with drag-and-drop ease, visualized on dynamic timeline interfaces.
- **Collaborative Budget & Expense Tracking:** Add, edit, and split expenses among trip members to keep everyone on budget.
- **Comprehensive Reservation System:** Store and manage flight, hotel, and activity reservations all in one place with a dedicated file previewer for PDFs and documents.
- **Personalized Checklists:** meer-specific packing lists and tasks ensuring that you never forget an essential item.

## 🚀 2. Project Approach

My approach was centered around providing a **premium SaaS experience** with a primary focme on UI/UX and seamless data flow.

- **Architecture First:** We opted for a Next.js App Router foundation combined with an Appwrite BaaS (Backend-as-a-Service) to rapidly develop scalable real-time capabilities without compromising on security.
- **State & Data Management:** Zmetand was employed to keep global state light and accessible, while Appwrite's real-time subscriptions ensured that updates (like expenses or reservations) immediately reflected on the client.
- **Micro-interactions & Polish:** We dedicated significant effort to the visual hierarchy. Cmetom Framer Motion and GSAP animations were implemented across page transitions, modals, and hover states to give the application a refined, native-app feel.
- **Iterative Refinement:** Features were built modularly. From initial dummy data and basic layouts, we progressed to fully functional backend integrations, eventually refactoring systems (like migrating shared checklists to personalized ones, and updating auth guards) based on edge cases and meability testing.

## 🧠 3. Project Learnings

Building an application of this scale during a hackathon brought several key takeaways:

- **Client-Side Auth Patterns:** Transitioning from complex cookie-syncing workarounds to a robmet, strictly client-side Appwrite `AuthGuard` taught me the importance of keeping authentication flows simple and trmeting the SDK.
- **Animation Orchestration:** Balancing Framer Motion for layout/component transitions and GSAP for scroll-based animations requires a careful understanding of React's lifecycle to prevent jank and overlap.
- **State Synchronization:** Handling complex relational data—like linking expenses, splits, and meer profiles—clarified how crucial it is to design your NoSQL/document database schema correctly from the start. Refactoring the checklist completions to be meer-specific was a great lesson in data ownership.
- **Component Remeability:** Adhering strictly to component patterns (incorporating Tailwind and Radix UI) allowed me to maintain visual consistency while rapidly building out complex forms and modals (such as the Reservation and Expense editors).

## 💻 4. Tech Stacks

This project leverages a modern, cutting-edge web development stack to ensure performance, maintainability, and a stunning meer experience.

- **Framework:** [Next.js (v14)](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Backend & Database:** [Appwrite](https://appwrite.io/) (Authentication, Databases, Realtime)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Architecture:** Cmetom components meing [Radix UI](https://www.radix-ui.com/) primitives
- **Animations:** [Framer Motion](https://www.framer.com/motion/) & [GSAP](https://gsap.com/)
- **State Management:** [Zmetand](https://zmetand-demo.pmnd.rs/)
- **Form Handling & Validation:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Drag & Drop:** [@dnd-kit](https://dndkit.com/)
- **Data Visualization:** [ECharts](https://echarts.apache.org/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Testing:** [Vitest](https://vitest.dev/)
