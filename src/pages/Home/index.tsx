import { useEffect, useRef, useState } from "react"
import {SWATCHES}from "@/constants";
import { ColorSwatch,Group } from "@mantine/core";
import { Button } from "@/components/ui/button";
import axios from 'axios';

// interface Response{
//     expr:string;
//     result:string;
//     assign:boolean;
// }

// interface GeneratedResult{
//     expression:string;
//     answer:string;

// }

const Home = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing,setIsDrawing]=useState(false);
    const [color ,setColor]=useState('rga(255,255,255)');
    const [reset,setRest]=useState(false);
    // const [result ,setResult]=useState<GeneratedResult>();
    const [dictOfVars]=useState({});

    useEffect(()=>{
        if(reset){
            resetCanvas();
            setRest(false)
        }
    },[reset]);

    useEffect(()=>{
        const  canvas = canvasRef.current;
        if(canvas){
            const ctx=canvas.getContext("2d");
            if(ctx){
                canvas.width=window.innerWidth;
                canvas.height=window.innerHeight;
                // brush Type & size
                ctx.lineCap= "round";
                ctx.lineWidth=3;
            }
        }
    },[])

    const sendData = async ()=>{
        const canvas = canvasRef.current;
        if(canvas){
            const response = await axios({
                method:"post",
                url:`${import.meta.env.VITE_API_URL}/calculate`,
                data:{
                    imaage:canvas.toDataURL('image/png'),
                    dict_of_vars:dictOfVars,
                }
            })
            const resp = await response.data;
            console.log("Response : ",resp);
            
        }
    }
    const resetCanvas = ()=>{
        const canvas = canvasRef.current;
        if(canvas){
            const ctx = canvas.getContext("2d");
            if(ctx){
                ctx.clearRect(0,0,canvas.width,canvas.height);
            }
        }
    }

    const startDrawing = (e:React.MouseEvent<HTMLCanvasElement>)=>{
        const canvas = canvasRef.current;
        if(canvas){
            canvas.style.background="black";
            const ctx = canvas.getContext("2d");
            if(ctx){
                ctx.beginPath();
                ctx.moveTo(e.nativeEvent.offsetX,e.nativeEvent.offsetY);
                setIsDrawing(true)
            }
        }
    }
    const stopDrawing =()=>{
        setIsDrawing(false);
    }
    const draw = (e:React.MouseEvent<HTMLCanvasElement>)=>{
        if(!isDrawing){
            return;
        }
        const canvas = canvasRef.current;
        if(canvas){
            const ctx=canvas.getContext("2d");
            if(ctx){
                ctx.strokeStyle=color;
                ctx.lineTo(e.nativeEvent.offsetX,e.nativeEvent.offsetY);
                ctx.stroke()
            }
        }

    }
  return (
    <>
    <div className="grid grid-cols-3 gap-2">
        <Button onClick={()=>setRest(true)}
        className="z-20 bg-black text-white "
        value="default"
        color="black"
        >Reset
        </Button>
        <Group className="z-20">
            {
            SWATCHES.map((swatchColor:string)=>(
                <ColorSwatch
                key={swatchColor}
                color={swatchColor}
                onClick={()=>setColor(swatchColor)}
                />
            ))}
        </Group>
        <Button onClick={sendData}
        className="z-20 bg-black text-white "
        value="default"
        color="black"
        >Calculate
        </Button>

    </div>
    <canvas ref={canvasRef}
    width={800}
    height={600}
    className="absolute top-0 left-0 w-full h-full"
    onMouseDown={startDrawing}
    onMouseMove={draw}
    onMouseOut={stopDrawing}
    onMouseUp={stopDrawing}/>
    </>

    
  )
}

export default Home