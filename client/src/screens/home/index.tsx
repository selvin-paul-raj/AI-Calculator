import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import Loading from '@/components/Loading';

interface GeneratedResult {
    expression: string;
    answer: string;
}

interface Response {
    expr: string;
    result: string;
    assign: boolean;
}



export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [reset, setReset] = useState(false);
    const [dictOfVars, setDictOfVars] = useState({});
    const [result, setResult] = useState<GeneratedResult>();
    const [resultsHistory, setResultsHistory] = useState<Array<GeneratedResult>>([]);
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
    const [showPopup, setShowPopup] = useState(false);
    const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (latexExpression.length > 0 && window.MathJax) {
            setTimeout(() => {
                window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
            }, 0);
        }
    }, [latexExpression]);

    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight - canvasRef.current.offsetTop;
            }
        };
        handleResize(); // Call on initial render
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const renderLatexToCanvas = (expression: string, answer: string) => {
        const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        setLatexExpression([...latexExpression, latex]);

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    useEffect(() => {
        if (result) {
            setResultsHistory([...resultsHistory, result]);
            renderLatexToCanvas(result.expression, result.answer);
        }
    }, [ result]);

    useEffect(() => {
        if (reset) {
            resetCanvas();
            setLatexExpression([]);
            setResult(undefined);
            setDictOfVars({});
            setResultsHistory([]);
            setReset(false);
        }
    }, [reset]);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - canvas.offsetTop;
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'white';
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
            script.async = true;
            document.head.appendChild(script);

            script.onload = () => {
                window.MathJax.Hub.Config({
                    tex2jax: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
                });
            };

            return () => {
                document.head.removeChild(script);
            };
        }
    }, []);

  
    const resetCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                setDrawingHistory([...drawingHistory, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
            }
            canvas.style.background = 'black';
            
            const getOffset = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
                if (e.nativeEvent instanceof MouseEvent) {
                  return { offsetX: e.nativeEvent.offsetX, offsetY: e.nativeEvent.offsetY };
                } else {
                  const touch = e.nativeEvent.touches[0];
                  return {
                    offsetX: touch.clientX - canvas.offsetLeft,
                    offsetY: touch.clientY - canvas.offsetTop
                  };
                }
              };
              
              const { offsetX, offsetY } = getOffset(e);
              
    
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(offsetX, offsetY);
                setIsDrawing(true);
            }
        }
    };
    
    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
    
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const getOffset = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
                if ('touches' in e.nativeEvent) {
                    // It's a TouchEvent
                    const touch = e.nativeEvent.touches[0];
                    return {
                        offsetX: touch.clientX - canvas.offsetLeft,
                        offsetY: touch.clientY - canvas.offsetTop
                    };
                } else {
                    // It's a MouseEvent
                    return {
                        offsetX: e.nativeEvent.offsetX,
                        offsetY: e.nativeEvent.offsetY
                    };
                }
                
            }
            const { offsetX, offsetY } = getOffset(e);
            if (ctx) {
                ctx.lineTo(offsetX, offsetY);
                ctx.stroke();
            }
        }
    };
    

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const undoLastDraw = () => {
        const canvas = canvasRef.current;
        if (canvas && drawingHistory.length > 0) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const lastDrawing = drawingHistory[drawingHistory.length - 1];
                ctx.putImageData(lastDrawing, 0, 0);
                setDrawingHistory(drawingHistory.slice(0, -1));
            }
        }
    };

    const runRoute = async () => {
        setShowPopup(true);
        setIsLoading(true); // Set loading state to true when API call starts

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/calculate`, {
                image: canvasRef.current?.toDataURL('image/png'),
                dict_of_vars: dictOfVars
            });
            const resp = response.data;

            resp.data.forEach((data: Response) => {
                if (data.assign) {
                    setDictOfVars({ ...dictOfVars, [data.expr]: data.result });
                }
                setResult({ expression: data.expr, answer: data.result });
            });
        } catch (error) {
            console.error("Error calculating:", error);
        } finally {
            setIsLoading(false); // Set loading state back to false after response
        }
    };


    const toggleHistory = () => {
        setShowPopup((prev) => !prev);
    };

    const clearHistory = () => {
        setResultsHistory([]);
        resetCanvas();
        setShowPopup(false);
    };

    useEffect(() => {
        const handleUndo = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'z') {
                undoLastDraw();
            }
        };

        document.addEventListener('keydown', handleUndo);
        return () => {
            document.removeEventListener('keydown', handleUndo);
        };
    }, [drawingHistory, undoLastDraw]);

    return (
        <>
            
            <div className="flex gap-2">
                <h1 className='text-center text-white z-50  w-full mt-6   text-2xl md:text-6xl font-extrabold'>SPR's AI Calculator</h1>
                <div className='flex flex-row z[99]'>
                <button
                    onClick={toggleHistory}
                    className="bg-white absolute m-4 z-[99] md:top-4 lg:right-[8rem] bottom-4 left-3 text-black hover:ring-1 hover:bg-white/50 w-20 h-10 rounded-md hover:transition-all"
                >
                    History
                </button>
                <button onClick={clearHistory} className="  absolute m-4 z-[99] md:top-4 md:right-28 w-20 h-10 rounded-md bottom-4 left-[6.25rem]  bg-red-600 hover:bg-red-700 text-white">
                    Clear
                </button>
                <button
                    
                    onClick={runRoute}
                    className="bg-white absolute m-4 z-[99] md:top-4 md:right-4 bottom-4 right-3 text-black hover:ring-1 hover:bg-white/50 h-10 w-24 rounded-md "
                >
                    
                    Calculate
                </button>
                </div>
            </div>

            <canvas
        ref={canvasRef}
        id="canvas"
        className="absolute top-0 left-0 w-full h-full bg-black"
        onMouseDown={startDrawing}
        onTouchStart={startDrawing}
        onMouseMove={draw}
        onTouchMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchEnd={stopDrawing}
    />

            <AnimatePresence>
                {showPopup && (
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "0%" }}
                        exit={{ x: "-100%" }}
                        transition={{ duration: 0.3 }}
                        className="absolute top-0 left-0 md:w-1/4  w-full h-full bg-gray-900 text-white p-4 overflow-y-auto"
                    >
                        
                        <hr className="mt-16 mb-2" />
                        <h2 className="text-lg font-bold mb-4 text-center">Results  </h2>
                        {result && (
                            <div className="mb-4 flex  justify-end">
                            
                            </div>
                        )}
                        {isLoading ? (
                            <Loading />
                        ) : (
                            resultsHistory.map((res, index) => (
                                <div key={index} className="mb-4 bg-re-500 z-50" >
                                    <p>Expression: {res.expression}</p>
                                    <p>Answer: {res.answer}</p>
                                </div>
                            ))
                        )}
                        
                    </motion.div>
                )}
            </AnimatePresence>
        </>

)
}