import './App.css';
import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core';
import BeatLoader from "react-spinners/BeatLoader";
/*import CustomPieChart from './components/PieChart'; unused */
import CustomBarChart from './components/BarChart';
import ProgressBar from './components/ProgressBar';

import { Draggable } from './components/Draggable';
import { Droppable } from './components/Droppable';
import { DragPreview } from './components/DragPreview';
import { set } from 'date-fns/set';

function App() {
  const [activeDisplayMenuId, setActiveDisplayMenuId] = useState("expense-menu")
  const [activeId, setActiveId] = useState(null);
  const [activeNodeStyles, setActiveNodeStyles] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(null);
  // This is where I can add/remove categories
  const [categoryElements, setCategoryElements] = useState({
    "groceries": {"amount": 0, "payments": []},
    "transport": {"amount": 0, "payments": []},
    "eating out": {"amount": 0, "payments": []},
    "items": {"amount": 0, "payments": []},
    "subscriptions": {"amount": 0, "payments": []},
    "other": {"amount": 0, "payments": []}
  });
  const [transactionData, setTransactionData] = useState({
    "payment_data": [],
    "income_data": []
  });
  const [calendar, setCalendar] = useState([]);

  function loadDatabasePayments() {
    window.paymentAPI.getPayments().then((vals) => {      
      const [payments, calendar] = vals;
      let expenses = payments.filter(p => p.type === "expense");
      let income = payments.filter(p => p.type === "income");
      if (expenses.length === 0 && income.length === 0) {
        return;
      }
      setTransactionData(() => ({
        "payment_data": expenses,
        "income_data": income
      }));
      setCategoryElements(transformDataToCategoryElements(expenses));
      setCalendar(calendar);
      setData(true);
    });
  }

  function LoadingSpinner() {
    return <div>
              <ProgressBar />
              <BeatLoader size={25} color="#2A9D8F" />
           </div>
  }

  const handleOpenFile = async () => {
    const filePath = await window.electronAPI.openFile();
    if (!filePath) return;

    setData(null);
    setLoading(true);

    const uniqueExpenseIds = transactionData.payment_data.map(p => p.unique_id) // maybe could remove json
    const uniqueIncomeIds = transactionData.income_data.map(p => p.unique_id)
    const uniqueIds = JSON.stringify([...new Set([...uniqueExpenseIds, ...uniqueIncomeIds])])
    const jsonData = await window.electronAPI.getJsonData(filePath, uniqueIds);

    // Check for new data to add to database
    jsonData.payment_data.forEach(payment => {
      if (payment.category) {
        window.paymentAPI.addPayment(payment, "expense");
      }
    });

    jsonData.income_data.forEach(payment => {
      window.paymentAPI.addPayment(payment, "income");
    });

    setData(false);
    loadDatabasePayments();
    setLoading(null);

  };

  function transformDataToCategoryElements(data) {
    const newCategoryElements = {
      "groceries": {"amount": 0, "payments": []},
      "transport": {"amount": 0, "payments": []},
      "eating out": {"amount": 0, "payments": []},
      "items": {"amount": 0, "payments": []},
      "subscriptions": {"amount": 0, "payments": []},
      "other": {"amount": 0, "payments": []}
    };

    data.forEach(payment => {
      newCategoryElements[payment.category].payments.push({ [payment.description]: [payment.amount, payment.date] });
      newCategoryElements[payment.category].amount += parseFloat(payment.amount);
    })

    return newCategoryElements
  };

  function getExpensesTotal(expenseData) {
    return expenseData.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2);
  }

  function getIncomeTotal(incomeData) {
    return incomeData.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2);
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

  if (!data) {
    loadDatabasePayments() // Checks database for existing payments, if none, shows starting screen
    
    return (
      <div className="starting-screen">
        {loading ? <LoadingSpinner /> : <>
        <h1>Welcome to your Expense Tracker</h1>
        <h1>Select CSV File To Get Started</h1>
        <button onClick={handleOpenFile}>Choose File</button></>
        }
        {data === false && <p style={{color: 'red'}}>No data found.</p>}
      </div>
    )
  }
  
  return (
      <div className="App">
        <h1 className="title">Total expenses: {getExpensesTotal(transactionData.payment_data)}€, total income: {getIncomeTotal(transactionData.income_data)}€</h1>
        <button onClick={() => changeDisplayMenu("expense-menu")}>Expenses</button>
        <button onClick={() => changeDisplayMenu("income-menu")}>Income</button>  
        <button onClick={() => changeDisplayMenu("chart-menu")}>Chart</button>
        <button onClick={() => changeDisplayMenu("fileSelect-menu")}>File Select</button>
        <button onClick={() => changeDisplayMenu("calendar-menu")}>Calendar</button>

          {activeDisplayMenuId === "calendar-menu" && (
            <div>
              <h2>Calendar view coming soon!</h2>  
              {console.log(calendar)}
              {Object.entries(calendar).map(([yearIndex, yearPayments]) => (
                <div key={yearIndex} className="year-container">
                  {console.log(yearPayments)}
                  <h3>{yearPayments[0].date.split('-')[0]}</h3>
                  <ul className="payment-list-container">
                    {yearPayments.map((payment, index) => (
                      <li key={`${payment.unique_id}-${index}`} className="payment-item">{payment.date} {payment.description} - <span className={payment.type === "expense" ? "red-text" : "green-text"}>{payment.amount} €</span></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {activeDisplayMenuId === "expense-menu" && (
          <div className='expense-lists-container'>
            <DndContext
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              collisionDetection={pointerWithin}
            >
              {Object.entries(categoryElements).map(([category, data]) => (
                <Droppable id={category} key={category}>
                  <div>
                    <div className='expense-list-title'>{category} - <span className='red-text'>{data.amount.toFixed(2) + "€"}</span></div>
                      <ul className='payment-list-container'>
                        {data.payments.map((payment, index) => {
                          const [[description, [amount, date]]] = Object.entries(payment);
                          return (
                              <Draggable 
                                id={`${category}-${index}`}
                                key={`${category}-${index}`}
                              > {date} {description} - <span className="red-text">{amount} €</span>
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
          <div>
            {transactionData.income_data.length === 0 ? (<p>No income data found.</p>) : (
              <ul className="income-list-container payment-list-container">
                {transactionData.income_data.map((income, index) => {
                  return (<li className="income-item" key={`${income.type}-${index}`}>{income.description} - <span className="green-text">{income.amount} €</span></li>)
                })}
              </ul>
            )}
          </div>
        )}
        {activeDisplayMenuId === "chart-menu" && (
        <div>
          <h2>Expenses chart:</h2>
            <div style={{width: '100%', height: 400}}>
              <CustomBarChart categoryElements={categoryElements}/>
            </div>
        </div>
        )}
        {activeDisplayMenuId === "fileSelect-menu" && (
          <div>
            {loading ? <LoadingSpinner /> : <>
            <h1>Select CSV File To Get Started</h1>
            <button onClick={handleOpenFile}>Choose File</button></>}
          </div>
        )}
      </div>


 );
}

export default App;