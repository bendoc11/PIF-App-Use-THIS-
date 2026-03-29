import { motion } from "framer-motion";
import { User, Trophy } from "lucide-react";

interface Props {
  onSelect: (type: "player" | "parent") => void;
}

export default function ScreenUserType({ onSelect }: Props) {
  const cards = [
    {
      type: "player" as const,
      icon: <User className="h-10 w-10" />,
      title: "I'M THE PLAYER",
      sub: "I want to level up my game",
    },
    {
      type: "parent" as const,
      icon: <Trophy className="h-10 w-10" />,
      title: "I'M A PARENT",
      sub: "I want to help my child improve",
    },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center px-6">
      <div className="max-w-md mx-auto w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl md:text-4xl font-heading text-foreground leading-tight">
            WHO ARE WE BUILDING THIS FOR?
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((card, i) => (
            <motion.button
              key={card.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * (i + 1) }}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => onSelect(card.type)}
              className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-sm text-center transition-all hover:border-primary/40 active:border-primary active:bg-primary/10"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-foreground">
                {card.icon}
              </div>
              <div>
                <p className="text-lg font-heading text-foreground">{card.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{card.sub}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
