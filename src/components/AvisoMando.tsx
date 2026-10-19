import { AnimatePresence, motion } from "framer-motion";
import { Gamepad2 } from "lucide-react";

export default function AvisoMando({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div className="gamepad-toast" role="status" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
          <span className="gamepad-toast-icon"><Gamepad2 size={17} /></span>
          <span>Mando conectado</span>
          <span className="gamepad-toast-key">A</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}