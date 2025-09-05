import './App.css';
import { useState } from 'react';
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core';
import BeatLoader from "react-spinners/BeatLoader";
/*import CustomPieChart from './components/PieChart'; unused */
import CustomBarChart from './components/BarChart';

import { Draggable } from './components/Draggable';
import { Droppable } from './components/Droppable';
import { DragPreview } from './components/DragPreview';


function App() {
  const [activeDisplayMenuId, setActiveDisplayMenuId] = useState("expense-menu")
  const [activeId, setActiveId] = useState(null);
  const [activeNodeStyles, setActiveNodeStyles] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(null);
  // This is where I can add/remove categories
  const [categoryElements, setCategoryElements] = useState({
    "groceries": {"amount": 0, "payments": []},
    "transport": {"amount": 0, "payments": []},
    "eating out": {"amount": 0, "payments": []},
    "items": {"amount": 0, "payments": []},
    "other": {"amount": 0, "payments": []}
  });
  const [incomeData, setIncomeData] = useState(null);

  function LoadingSpinner() {
    return <div>
              <BeatLoader size={25} color="#2A9D8F" />
           </div>
  }

  const handleOpenFile = async () => {
    const filePath = await window.electronAPI.openFile();
    if (!filePath) return;
    setLoading(true)

    const jsonData = await window.electronAPI.getJsonData(filePath);
    console.log(jsonData)

    setCategoryElements(jsonData.payment_data);
    setIncomeData(jsonData.income_data)
    setFile(filePath);
    setLoading(null)
  };

  function getExpensesTotal(jsonData) {
    return Object.values(jsonData).reduce((sum, category) => sum + category.amount, 0).toFixed(2);
  }

  function getIncomeTotal(incomeData) {
    let sum = incomeData.flat().reduce((acc, item) => 
        acc + parseFloat(item.amount.replace(",", ".")), 0);
    return sum
  }

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

  function handleDragStart(event) {
    const { active } = event;
    setActiveId(active.id);

    const node = document.querySelector(`[data-id='${active.id}']`);

    if (node) {
      const computedStyles = window.getComputedStyle(node);

      const styleProps = [
        'width',
        'height',
        'backgroundColor',
        'color',
        'fontSize',
        'fontWeight',
        'border',
        'borderRadius',
        'boxShadow',
        'padding',
        'margin',
        'display',
        'alignItems',
        'justifyContent',
        // add more as needed
      ];

      const inlineStyles = {};
      styleProps.forEach(prop => {
        inlineStyles[prop] = computedStyles.getPropertyValue(prop);
      });
      setActiveNodeStyles(inlineStyles);
    }
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
    setActiveId(null);
  }

  function getPaymentContentById(id) {
    const { category, index } = parseId(id);
    const [[ payment, amount ]] = Object.entries(categoryElements[category]['payments'][index])
    return `${payment} - ${amount} €`
  }

  function changeDisplayMenu(newMenuId) {
    setActiveDisplayMenuId(newMenuId)
  }

  if (!file) {
    return (
      <div className="file-selection">
        {loading ? <LoadingSpinner /> : <>
        <h1>Select CSV File To Get Started</h1>
        <button onClick={handleOpenFile}>Choose File</button></>}
      </div>
    )
  }

  return (
      <div className="App">
        <h1 className="title">Total expenses: {getExpensesTotal(categoryElements)}€, total income: {getIncomeTotal([incomeData])}€</h1>
        <button onClick={() => changeDisplayMenu("expense-menu")}>Expenses</button>
        <button onClick={() => changeDisplayMenu("income-menu")}>Income</button>
        <button onClick={() => changeDisplayMenu("chart-menu")}>Chart</button>
        <button onClick={() => changeDisplayMenu("fileSelect-menu")}>File Select</button>

          {activeDisplayMenuId === "expense-menu" && (
          <div className='lists-container'>
            <DndContext
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              collisionDetection={pointerWithin}
            >
              {Object.entries(categoryElements).map(([category, data]) => (
                <Droppable id={category} key={category}>
                  <div>
                    <div className='list-title'>{category} - {data.amount.toFixed(2) + "€"}</div>
                      <ul className='list-payments'>
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
  
              <DragOverlay dropAnimation={null}>
                {activeId ? (<DragPreview styles={{ ...activeNodeStyles }}>
                  {getPaymentContentById(activeId)}
                </DragPreview>
              ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
        {activeDisplayMenuId === "income-menu" && (
          <div className='income-list-container'>
            <ul>
            {incomeData.map(income => {
              return (<li>{income.explanation} - {income.amount}</li>)
            })}
            </ul>
          </div>
        )}
        {activeDisplayMenuId === "chart-menu" && (
        <div>
          <h2>Chart:</h2>
            <div style={{width: '100%', height: 400}}>
              <CustomBarChart categoryElements={categoryElements}/>
            </div>
        </div>
        )}
        {activeDisplayMenuId === "fileSelect-menu" && (
          <div>
            <h1>Select File</h1>
            <button onClick={handleOpenFile}>Choose File</button>
          </div>
        )}
      </div>


 );
}

export default App;