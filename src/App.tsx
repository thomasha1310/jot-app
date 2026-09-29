import { Dashboard } from "./components/Dashboard";
import { Sidebar } from "./components/Sidebar";

export default function App() {
    return (
        <div className="flex p-4 gap-4 h-screen w-full overflow-hidden bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Dashboard />
            </main>
        </div>
    );
}
