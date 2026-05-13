import { Inbox, Lock, ArrowRight } from "lucide-react";
import { useUnreadReplies } from "@/hooks/useUnreadReplies";
import { useAuth } from "@/contexts/AuthContext";
import { isPaidSubscriber, STRIPE_CHECKOUT_URL } from "@/lib/subscription";

interface Props {
  onView: () => void;
}

export function UnreadRepliesBanner({ onView }: Props) {
  const count = useUnreadReplies();
  const { profile, hasActiveSubscription } = useAuth();
  const isPaid = isPaidSubscriber(profile, hasActiveSubscription);

  if (!isPaid) {
    return (
      <a
        href={STRIPE_CHECKOUT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full bg-pif-red hover:bg-pif-red/90 text-white px-4 py-3 flex items-center gap-3 text-sm font-semibold shadow-sm animate-fade-in"
      >
        <Lock className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-left">Unlock replies from college coaches</span>
        <ArrowRight className="h-4 w-4 shrink-0" />
      </a>
    );
  }

  if (count <= 0) return null;
  return (
    <button
      onClick={onView}
      className="w-full bg-pif-red hover:bg-pif-red/90 text-white px-4 py-3 flex items-center gap-3 text-sm font-semibold shadow-sm animate-fade-in"
    >
      <Inbox className="h-5 w-5 shrink-0" />
      <span className="flex-1 text-left">
        You have {count} new {count === 1 ? "reply" : "replies"} from college coaches. View them now.
      </span>
      <ArrowRight className="h-4 w-4 shrink-0" />
    </button>
  );
}
