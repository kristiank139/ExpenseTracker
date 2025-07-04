import './App.css';
import { useState } from 'react';
import { DndContext } from '@dnd-kit/core';

import { Draggable } from './Draggable';
import { Droppable } from './Droppable';


function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  // This is where I can add/remove categories
  const [categoryElements, setCategoryElements] = useState({
    "groceries": {"amount": 0, "payments": []},
    "transport": {"amount": 0, "payments": []},
    "eating out": {"amount": 0, "payments": []},
    "items": {"amount": 0, "payments": []},
    "other": {"amount": 0, "payments": []}
  })

  const handleOpenFile = async () => {
    const filePath = await window.electronAPI.openFile();
    if (!filePath) return;

    const jsonData = await window.electronAPI.getJsonData(filePath);

    setCategoryElements(jsonData);
    setSelectedFile(filePath);
  };

  function safeSubtract(a, b, tolerance = 1e-10) { // To avoid getting -0 as a result
    const result = a - b;
    return Math.abs(result) < tolerance ? 0 : result;
  }

  function parseId(id) {
    const index = id.lastIndexOf('-');
    if (index === -1) return null;
    return {
      category: id.slice(0, index),
      index: Number(id.slice(index + 1)),
    };
  }
  function handleDragEnd(event) {
    const { active, over} = event;

    if (!over) {
      return;
    }

    const from = parseId(active.id);
    if (!from) return;

    const toCategory = over.id;

    if (from.category === toCategory) return; // Could add reordering here

    setCategoryElements((prev) => {
      const fromCategory = prev[from.category];
      const toCategoryObj = prev[toCategory];

      const fromPayments = [...fromCategory.payments];
      const toPayments = [...toCategoryObj.payments];

      const paymentAmount = Object.values(prev[from.category]['payments'][from.index])[0]

      const fromAmount = safeSubtract(parseFloat(prev[from.category]['amount']), parseFloat(paymentAmount))
      const toAmount = parseFloat(prev[toCategory]['amount']) + parseFloat(paymentAmount)

      const [movedItem] = fromPayments.splice(from.index, 1)
      toPayments.push(movedItem);

      return {
        ...prev,
        [from.category]: {
          ...fromCategory,
          amount: fromAmount,
          payments: fromPayments
        },
        [toCategory]: {
          ...toCategoryObj,
          amount: toAmount,
          payments: toPayments
        }
      }
    })
  }

  return (
      <div className="App">
        <h1>Expenses:</h1>
          <div className='lists-container'>
            <DndContext onDragEnd={handleDragEnd}>

            {Object.entries(categoryElements).map(([category, data]) => (
              <Droppable id={category} key={category}>
                <div className="droppable-box">
                  <div className='list'>{category} - {data.amount.toFixed(2) + "€"}</div>
                    <ul>
                      {data.payments.map((payment, index) => {
                        const [[description, amount]] = Object.entries(payment);
                        return (
                        <Draggable 
                        id={`${category}-${index}`}
                        key={`${category}-${index}`}
                        >
                          {description} - {amount} €
                        </Draggable>
                      );
                    })}
                    </ul>
                </div>
              </Droppable>
            ))}
            </DndContext>
          </div>
        <h1>Select File</h1>
        <button onClick={handleOpenFile}>Choose File</button>
      </div>

 );
}


export default App;
