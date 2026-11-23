import { StudyBuddyApp } from '@/components/StudyBuddyApp';
import { SessionProvider } from '@/lib/session/SessionContext';

export default function Home() {
  return (
    <SessionProvider>
      <StudyBuddyApp />
    </SessionProvider>
  );
}
