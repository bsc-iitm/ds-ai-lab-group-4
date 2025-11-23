import { motion } from "framer-motion";

export const Greeting = () => {
  return (
    <div
      className="mt-4 flex size-full max-w-3xl flex-col justify-center md:mt-16"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="font-semibold text-2xl md:text-4xl mb-4"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        Welcome to AgroSense! 🌾
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-xl text-zinc-500 md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        Your trusted agricultural advisor for every stage of crop management
      </motion.div>
    </div>
  );
};
