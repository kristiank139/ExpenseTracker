import './App.css';
import { useState } from 'react';
import { DndContext } from '@dnd-kit/core';

import { Draggable } from './Draggable';
import { Droppable } from './Droppable';


function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [categorizedJsonPayments, setData] = useState(null);
  const [parent, setParent] = useState(null);

  const draggableMarkup = (
    <Draggable id="draggable">Drag me</Draggable>
  );

  const handleOpenFile = async () => {
    const filePath = await window.electronAPI.openFile();
    if (!filePath) return;

    const jsonData = await window.electronAPI.getJsonData(filePath);
    setData(jsonData);
    setSelectedFile(filePath);
  };

  return (
      <div className="App">
        <h1>Expenses:</h1>
          <div className='lists-container'>
            <DndContext onDragEnd={handleDragEnd}>
            {parent === null ? draggableMarkup : null}

            {categorizedJsonPayments && Object.entries(categorizedJsonPayments).map(([category, data], index) => (
              <Droppable key={category} id={category}>
                <div className="droppable-box">
                  {parent === category ? draggableMarkup : 'Drop here'}
                  <div className='list'>{category} - {data.amount.toFixed(2) + "€"}</div>
                    <ul>
                      {data.payments.map((paymentObj, index) => {
                        const [payment, amount] = Object.entries(paymentObj)[0];
                        return <li key={index}>{payment} - {amount} €</li>
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

 function handleDragEnd(event) {
    const {over} = event;

    // If the item is dropped over a container, set it as the parent
    // otherwise reset the parent to `null`
    setParent(over ? over.id : null);
  }
}


export default App;
