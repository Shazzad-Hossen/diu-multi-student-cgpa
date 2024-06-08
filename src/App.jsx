import axios from 'axios';
import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ExcelJS from 'exceljs'
import Ldng from './assets/loading.svg'

const App = () => {
  const [semesters, setSemesters]=useState([]);
  const [studentId, setStudentId]=useState('');
  const [results, setResults]=useState([]);
  const [loading, setLoading]=useState(false);

  useEffect(()=>{
    setLoading(true);
    (async()=>{
     try {
      const res = await axios.get('https://diu-cgpa-proxy-44yg.vercel.app/result/semesterList');
      setSemesters(res.data);
      setLoading(false);
     } catch (error) {
      console.log(error);
      toast.error('Something went wrong. Please try again later');
      setLoading(false);

     }

    })();

   
  },[]);

  const getResults =async()=>{
    setLoading(true);
    if(!studentId) return   toast.warn('Please Enter your studen id');
    const studentIds=studentId.split(',');
    
    let resultsData=[];

    await Promise.all(studentIds.map(async stuId=>{
     
      try {
        const info = await axios.get(`https://diu-cgpa-proxy-44yg.vercel.app/result/studentInfo?studentId=${stuId}`);
        const FILTERED_SEMESTERS =semesters.filter(s=>Number(s.semesterId)>=Number(info.data.semesterId));
        let res=[];
        await Promise.all(FILTERED_SEMESTERS.map(async s=>{
         try {
          const response = await axios.get(`https://diu-cgpa-proxy-44yg.vercel.app/result?semesterId=${s.semesterId}&studentId=${stuId}`);
         if(response.data.length>0) res=[...res,  ...response.data]
          return s;
          
         } catch (error) {
          console.log(error);
          return s;
         }
        
        }));

        resultsData=[...resultsData, {studentId: stuId, results: res, name: info.data.studentName}]

  

        //
      } catch (error) {
        console.log(error);
        return stuId
        
      }

      }))
      
      setResults(resultsData);
      setLoading(false);
  
  }

  const calculateCgpa=(data)=>{
    let totalWeightedGPA = 0;
    let totalCredits = 0;
    data.forEach(course => {
      totalWeightedGPA += course.pointEquivalent * course.totalCredit;
      totalCredits += course.totalCredit;
  });


  if (totalCredits === 0) {
    return 0; 
}

return (totalWeightedGPA / totalCredits).toFixed(2) || '0.00';

  }

const exportAsXLSX = (data)=> {
    const workhook = new ExcelJS.Workbook();
    const sheet = workhook.addWorksheet();
    sheet.properties.defaultColWidth=80;
   sheet.columns =[
        {
            header: 'Student Id',
            key: 'stuId',
            width: 10
        },
        {
            header: 'Student Name',
            key: 'stuName',
            width: 30
        },
        {
            header: 'CGPA',
            key: 'cgpa',
            width: 10
        }
    ]
    
    data.forEach((element) => {
      sheet.addRow({
          stuId: element.studentId,
          stuName: element.name,
          cgpa: calculateCgpa(element.results)
      })
      
  });


    workhook.xlsx.writeBuffer().then(data=>{
        const blob = new Blob([data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheet.sheet'
        });

        const url = URL.createObjectURL(blob);
        const a= document.createElement('a');
        a.href=url;
        a.download='Students CGPA LIST.xlsx';
        a.click();
        URL.revokeObjectURL(url);
    })
    
}


  return (
    <div className="">
      {loading?<div className='w-screen h-screen flex justify-center items-center'>
        <img src={Ldng} alt="Loading" className='w-[150px] h-[150px]' />
      </div>:
      <div className='p-10 '>
      <ToastContainer />
     <div className="h-full w-full flex justify-center items-center gap-3 my-20 flex-col sm:flex-row">
       <input type="text" className='border-2 rounded outline-none focus:border-sky-600/50 p-2 w-full max-w-[300px] ' placeholder='Ex: 191-15-2420 or 191-15-2420, 191-15-2523 ' value={studentId} onChange={(e)=>setStudentId(e.target.value)} />
       <button className='bg-sky-600 p-2 border-2 border-sky-600 rounded text-white font-[500] active:scale-95 flex-shrink-0' onClick={getResults}>Generate Result</button>

     </div>

     {
       results.length>0 && <div className="">
        <div className="flex justify-end"> <button className='bg-black/50 text-white py-1 px-2 rounded mb-2 active:scale-95' onClick={()=>exportAsXLSX(results)}>Export</button></div>
          <div className="overflow-x-auto">
       <table className="min-w-full divide-y divide-gray-200">
         <thead className="bg-gray-50">
           <tr>
             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
               Student ID
             </th>
             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
               Student Name
             </th>
             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
               CGPA
             </th>
           </tr>
         </thead>
         <tbody>
           {results.map((r, index) => (
             <tr key={r.studentId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.studentId}</td>
               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.name}</td>
               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{calculateCgpa(r.results)}</td>
             </tr>
           ))}
         </tbody>
       </table>
     </div>
       </div>
     }
     
     
   </div>}
    </div>
  );
};

export default App;