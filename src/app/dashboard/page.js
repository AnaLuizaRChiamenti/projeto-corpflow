'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "../../css/dashboard.css";

const ItemTypes = {
  CARD: "CARD",
  BLOCK: "BLOCK",
};

const TaskCard = ({ task, index, moveCard, listId, onDropBlock, role }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    item: { id: task.id, index, listId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.BLOCK,
    drop: (item) => {
      onDropBlock(task.id, listId, item.blockType);
    },
  });

  return (
    <div ref={(node) => drag(drop(node))} className="task-card" style={{ opacity: isDragging ? 0.5 : 1 }}>
      <div className="task-card-header">
        <h4>{task.title}</h4>
        <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
      </div>
      <p>{task.description}</p>
      <div className="task-card-footer">
        <span className="due-date">Prazo: {task.dueDate}</span>
      </div>
      <div className="task-blocks">
        {task.blocks?.map((block, idx) => (
          <span key={idx} className={`block ${block.toLowerCase()}`}>
            {block}
          </span>
        ))}
      </div>
    </div>
  );
};

const Block = ({ type, role }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.BLOCK,
    item: { blockType: type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => role === "gerente" || (role === "funcionario" && type === "Concluído"),
  });

  return (
    <button ref={drag} className={`block-button ${type.toLowerCase()}`} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {type}
    </button>
  );
};

const TaskList = ({ title, tasks, listId, moveCard, onRemoveColumn, onDropBlock, role }) => {
  const [, drop] = useDrop({
    accept: ItemTypes.CARD,
    drop(item) {
      if (!item) return;
      const dragIndex = item.index;
      const dragListId = item.listId;
      const hoverListId = listId;

      if (dragListId === hoverListId) {
        return;
      }

      moveCard(item.id, dragListId, hoverListId);
    },
  });

  return (
    <div className="kanban-column" ref={drop}>
      <div className="column-header">
        <h3>{title}</h3>
        <div className="column-header-actions">
          <span className="task-count">{tasks.length}</span>
          {!["todo", "waitingApproval", "inProgress"].includes(listId) && role === "gerente" && (
            <button className="remove-column-btn" onClick={() => onRemoveColumn(listId)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="task-list">
        {tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            index={index}
            moveCard={moveCard}
            listId={listId}
            onDropBlock={onDropBlock}
            role={role}
          />
        ))}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(null);
  const [newTask, setNewTask] = useState({ title: "", description: "", dueDate: "", priority: "média" });
  const [errorMsg, setErrorMsg] = useState("");
  const [completedTasks, setCompletedTasks] = useState([]);
  const [tasks, setTasks] = useState([]);

  const validateTask = (task) => {
    return (
      task &&
      typeof task.id === 'number' &&
      typeof task.title === 'string' &&
      typeof task.columnId === 'string' &&
      ['todo', 'waitingApproval', 'inProgress'].includes(task.columnId)
    );
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userLogado = JSON.parse(localStorage.getItem("userLogado"));
      if (userLogado) {
        setUser(userLogado);
      } else {
        window.location.href = "/";
      }
      setIsLoading(false);

      const savedCompletedTasks = localStorage.getItem("completedTasks");
      try {
        const parsedCompletedTasks = savedCompletedTasks ? JSON.parse(savedCompletedTasks) : [];
        setCompletedTasks(parsedCompletedTasks);
      } catch (e) {
        setErrorMsg("Erro ao carregar tarefas concluídas.");
        setCompletedTasks([]);
      }

      const savedTasks = localStorage.getItem("sharedTasks");
      try {
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
        const validTasks = parsedTasks.filter(validateTask);
        setTasks(
          validTasks.sort((a, b) => {
            const priorityOrder = { alta: 3, média: 2, baixa: 1 };
            const priorityA = priorityOrder[a.priority.toLowerCase()] || 0;
            const priorityB = priorityOrder[b.priority.toLowerCase()] || 0;
            return priorityB - priorityA;
          })
        );
      } catch (e) {
        setErrorMsg("Erro ao carregar tarefas.");
        setTasks([]);
      }
    }
  }, []);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem("sharedTasks", JSON.stringify(tasks));
        localStorage.setItem("completedTasks", JSON.stringify(completedTasks));
      } catch (e) {
        console.error("Erro ao salvar no localStorage:", e);
        setErrorMsg("Erro ao salvar dados. Verifique o armazenamento do navegador.");
      }
    }
  }, [tasks, completedTasks]);

  const getFilteredColumns = () => {
    if (!user) {
      return {
        todo: { title: "A fazer", items: [] },
        waitingApproval: { title: "Esperando Aprovação", items: [] },
        inProgress: { title: "Em andamento", items: [] },
      };
    }

    const columns = {
      todo: { title: "A fazer", items: [] },
      waitingApproval: { title: "Esperando Aprovação", items: [] },
      inProgress: { title: "Em andamento", items: [] },
    };

    tasks.forEach((task) => {
      if (task.completed) return;
      columns[task.columnId].items.push(task);
    });

    Object.keys(columns).forEach((colId) => {
      columns[colId].items = sortTasksByPriority(columns[colId].items);
    });

    return columns;
  };

  const sortTasksByPriority = (tasks) => {
    const priorityOrder = { alta: 3, média: 2, baixa: 1 };
    return [...tasks].sort((a, b) => {
      const priorityA = priorityOrder[a.priority.toLowerCase()] || 0;
      const priorityB = priorityOrder[b.priority.toLowerCase()] || 0;
      return priorityB - priorityA;
    });
  };

  const moveCard = (cardId, sourceListId, targetListId) => {
    if (sourceListId === targetListId) return;
    setTasks((prevTasks) => {
      const task = prevTasks.find((t) => t.id === cardId);
      if (!task) return prevTasks;
      return sortTasksByPriority([
        ...prevTasks.filter((t) => t.id !== cardId),
        { ...task, columnId: targetListId },
      ]);
    });
  };

  const removeColumn = (columnId) => {
    if (["todo", "waitingApproval", "inProgress"].includes(columnId)) return;
    setTasks((prevTasks) => prevTasks.filter((t) => t.columnId !== columnId));
  };

  const isValidDate = (dateStr) => {
    const day = parseInt(dateStr.slice(0, 2));
    const month = parseInt(dateStr.slice(2, 4));
    const year = parseInt(dateStr.slice(4, 8));
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
  };

  const addNewTask = () => {
    if (
      !newTask.title.trim() ||
      !newTask.description.trim() ||
      !newTask.dueDate.match(/^\d{8}$/) ||
      !isValidDate(newTask.dueDate) ||
      !["alta", "média", "baixa"].includes(newTask.priority.toLowerCase())
    ) {
      setErrorMsg(
        "Preencha todos os campos corretamente! O prazo deve ser no formato DDMMAAAA (ex.: 15052025) e uma data válida."
      );
      return;
    }

    const newTaskId = Date.now();
    const formattedDate = `${newTask.dueDate.slice(0, 2)}/${newTask.dueDate.slice(2, 4)}/${newTask.dueDate.slice(4, 8)}`;
    const task = {
      id: newTaskId,
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority.toLowerCase(),
      dueDate: formattedDate,
      createdBy: user.name,
      columnId: "todo",
      blocks: [],
      completed: false,
    };

    setTasks((prevTasks) => sortTasksByPriority([...prevTasks, task]));
    setNewTask({ title: "", description: "", dueDate: "", priority: "média" });
    setShowNewTaskModal(false);
    setErrorMsg("");
  };

  const onDropBlock = (taskId, listId, blockType) => {
    setTasks((prevTasks) => {
      const task = prevTasks.find((t) => t.id === taskId);
      if (!task) return prevTasks;

      if (blockType === "Aprovado" && user?.role !== "gerente") {
        setErrorMsg("Somente gerentes podem aprovar tarefas!");
        return prevTasks;
      }

      if (blockType === "Aprovado" && !task.blocks?.includes("Verificado")) {
        setErrorMsg("Adicione um bloco VERIFICAR antes de APROVAR!");
        return prevTasks;
      }

      if (blockType === "Concluído" && (!task.blocks?.includes("Verificado") || !task.blocks?.includes("Aprovado"))) {
        setErrorMsg("A tarefa deve ser VERIFICADA e APROVADA antes de ser concluída!");
        return prevTasks;
      }

      task.blocks = task.blocks || [];
      if (!task.blocks.includes(blockType)) {
        task.blocks.push(blockType);
        let newColumnId = task.columnId;

        if (blockType === "Verificado" && task.columnId !== "waitingApproval") {
          newColumnId = "waitingApproval";
        } else if (blockType === "Aprovado" && task.columnId !== "inProgress" && user?.role === "gerente") {
          newColumnId = "inProgress";
        } else if (blockType === "Concluído") {
          task.completed = true;
          setCompletedTasks((prev) => {
            const updatedCompletedTasks = [
              ...prev.filter((t) => t.id !== taskId),
              {
                id: task.id,
                title: task.title,
                description: task.description,
                dueDate: task.dueDate,
              },
            ];
            return updatedCompletedTasks;
          });
        }

        return sortTasksByPriority([
          ...prevTasks.filter((t) => t.id !== taskId),
          { ...task, columnId: newColumnId },
        ]);
      }

      return prevTasks;
    });
    setErrorMsg("");
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const getInitials = (name) => {
    if (!name) return "??";
    const names = name.trim().split(" ");
    const initials = names
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join("");
    return initials || "??";
  };

  const handleLogout = () => {
    localStorage.removeItem("userLogado");
    window.location.href = "/";
  };

  const availableBlocks = user?.role === "gerente" ? ["Verificado", "Aprovado", "Concluído"] : ["Concluído"];
  const columns = getFilteredColumns();
  const columnOrder = ["todo", "waitingApproval", "inProgress"];

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <Image
            src={sidebarCollapsed ? "https://i.postimg.cc/kg3BbhCm/corpflow-logo.png" : "https://i.postimg.cc/W1xNjHP7/corpflow.png"}
            alt="CorpFlow Logo"
            className="logo"
            width={sidebarCollapsed ? 50 : 250}
            height={sidebarCollapsed ? 50 : 130}
          />
          <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
            {sidebarCollapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="13 17 18 12 13 7"></polyline>
                <polyline points="6 17 11 12 6 7"></polyline>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            )}
          </button>
        </div>
        <div className="sidebar-content">
          <div className="section">
            <h3>Blocos disponíveis</h3>
            <div className="block-section">
              {availableBlocks.map((block) => (
                <Block key={block} type={block} role={user?.role} />
              ))}
            </div>
          </div>
          <div className="section">
            <h3>Tarefas concluídas</h3>
            {completedTasks.length === 0 ? (
              <p>Nenhuma tarefa concluída.</p>
            ) : (
              <ul>
                {completedTasks.map((task) => (
                  <li key={task.id}>
                    <button className="completed-task" onClick={() => setShowTaskDetails(task)}>
                      {task.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <div className={`main-content ${sidebarCollapsed ? "expanded" : ""}`}>
        <div className="header">
          <div className="dropdown">
            <button className="dropdown-button">
              <span>Bem vindo(a), {user?.name || "Usuário"}</span>
              <div className="avatar">{user ? getInitials(user.name) : "??"}</div>
            </button>
            <div className="dropdown-content">
              <button onClick={handleLogout}>
                <Image
                  src="https://img.icons8.com/material-outlined/24/000000/logout-rounded.png"
                  alt="Logout Icon"
                  width={24}
                  height={24}
                />
                Logout
              </button>
            </div>
          </div>
        </div>
        <div className="task-section">
          <div className="task-header">
            <h2>Minhas tarefas</h2>
            <div className="task-actions">
              {user?.role === "gerente" && (
                <button className="create-task-button" onClick={() => setShowNewTaskModal(true)}>
                  + Nova tarefa
                </button>
              )}
            </div>
          </div>
          {errorMsg && <div className="error-message">{errorMsg}</div>}
          <div className="kanban-board">
            {Object.keys(columns)
              .sort((a, b) => {
                const aIndex = columnOrder.indexOf(a) !== -1 ? columnOrder.indexOf(a) : columnOrder.length;
                const bIndex = columnOrder.indexOf(b) !== -1 ? columnOrder.indexOf(b) : columnOrder.length;
                return aIndex - bIndex;
              })
              .map((columnId) => (
                <TaskList
                  key={columnId}
                  title={columns[columnId].title}
                  tasks={columns[columnId].items}
                  listId={columnId}
                  moveCard={moveCard}
                  onRemoveColumn={removeColumn}
                  onDropBlock={onDropBlock}
                  role={user?.role}
                />
              ))}
          </div>
        </div>
      </div>
      {showNewTaskModal && user?.role === "gerente" && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Nova Tarefa</h3>
              <button className="close-modal" onClick={() => setShowNewTaskModal(false)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label htmlFor="taskTitle">Título</label>
                <textarea
                  id="taskTitle"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Digite o título da tarefa"
                  rows="2"
                />
              </div>
              <div className="input-group">
                <label htmlFor="taskDescription">Descrição</label>
                <textarea
                  id="taskDescription"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Digite a descrição da tarefa"
                  rows="4"
                />
              </div>
              <div className="input-group">
                <label htmlFor="taskDueDate">Prazo (DDMMAAAA)</label>
                <input
                  type="text"
                  id="taskDueDate"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  placeholder="Ex.: 15052025"
                />
              </div>
              <div className="input-group">
                <label htmlFor="taskPriority">Prioridade</label>
                <select
                  id="taskPriority"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                >
                  <option value="alta">Alta</option>
                  <option value="média">Média</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>
              {errorMsg && <div className="error-message">{errorMsg}</div>}
            </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setShowNewTaskModal(false)}>
                Cancelar
              </button>
              <button className="confirm-button" onClick={addNewTask}>
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
      {showTaskDetails && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Detalhes da Tarefa</h3>
              <button className="close-modal" onClick={() => setShowTaskDetails(null)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="task-detail">
                <strong>Título:</strong> {showTaskDetails.title}
              </div>
              <div className="task-detail">
                <strong>Descrição:</strong> {showTaskDetails.description}
              </div>
              <div className="task-detail">
                <strong>Prazo:</strong> {showTaskDetails.dueDate}
              </div>
            </div>
            <div className="modal-footer">
              <button className="confirm-button" onClick={() => setShowTaskDetails(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </DndProvider>
  );
}