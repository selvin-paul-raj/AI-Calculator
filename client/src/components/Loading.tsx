import {  motion } from 'framer-motion';

const Loading = () => {
  return (
    <motion.div
    className="loading-spinner"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ repeat: Infinity, duration: 0.5 }}
>

<div className="flex items-center space-x-2">

<div className="space-y-2">
<div className="animate-pulse rounded-md bg-gray-500 h-4 w-[200px]"> </div>
<div className="animate-pulse rounded-md bg-gray-500 h-4 w-[170px]"> </div>
</div>
</div>

</motion.div>
    
  )
}

export default Loading