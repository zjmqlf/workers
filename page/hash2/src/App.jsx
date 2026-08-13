'use client';
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { AgGridReact } from "ag-grid-react";
//import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import {
  ClientSideRowModelApiModule,
  ClientSideRowModelModule,
  ModuleRegistry,
  RowApiModule,
  RowStyleModule,
  RowSelectionModule,
  ColumnApiModule,
  NumberFilterModule,
  TextFilterModule,
  PaginationModule,
  HighlightChangesModule,
  ValidationModule,
  ScrollApiModule,
} from "ag-grid-community";
import {
  RowGroupingModule,
} from "ag-grid-enterprise";
//import "./App.css"

//ModuleRegistry.registerModules([AllCommunityModule]);
ModuleRegistry.registerModules([
  ClientSideRowModelApiModule,
  ClientSideRowModelModule,
  RowApiModule,
  RowStyleModule,
  RowSelectionModule,
  ColumnApiModule,
  TextFilterModule,
  NumberFilterModule,
  PaginationModule,
  HighlightChangesModule,
  ValidationModule,
  RowGroupingModule,
  ScrollApiModule,
]);

const App = () => {
  let key = 0;
  let waitReconnect = null;
  // const pagination = true;
  // const paginationPageSize = 50;
  // const paginationPageSizeSelector = [50, 150, 200];
  // const runningCount = useRef(0);
  const gridRef = useRef(null);
  const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
  const gridStyle = useMemo(() => ({ width: "100%", height: "80%" }), []);
  const [documentValue, setDocumentValue] = useState(2);
  const [isClearLogBtnDisabled, setClearLogBtnDisabled] = useState(true);
  const [pauseBtnText, setPauseBtnText] = useState("开始");
  const [isCompressChecked, setCompressChecked] = useState(false);
  const [isBatchChecked, setBatchChecked] = useState(false);
  const [rowData, setRowData] = useState([{
    "clientId": 1,
    "clientName": "2025",
    "url": "wss://hash.19421.xyz/ws"
  }]);
  const [logData, setLogData] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isSendBtnDisabled, setSendBtnDisabled] = useState(true);
  const clientCount = rowData.length;
  const clientArray = useRef(Array(clientCount).fill({
    "ws": null,
    "stop": false,
    "over": false,
    "timeOut": null,
    "errorCount": 0,
    "waitTime": 30000,
    "rowData": {},
  }));
  const idArray = useRef({});
  const getRowId = useCallback((params) => String(params.data.chatId), []);

  for (let clientIndex = 0; clientIndex < clientCount; clientIndex++) {
    clientArray.current[clientIndex].rowData = rowData[clientIndex];
    idArray[rowData[clientIndex].clientId] = clientArray.current[clientIndex];
  }

  const resultRenderer = useCallback((params) => {
    return params.value === true ?
      <span className="missionSpan">
        {<img alt="" src="icons/tick-in-circle.png" className="missionIcon"/>}
      </span> :
      params.value === false ?
        <span className="missionSpan">
          {<img alt="" src="icons/cross-in-circle.png" className="missionIcon"/>}
        </span> :
        "";
  }, []);

  const renderSize = useCallback((value) => {
    if (value) {
      const unitArr = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
      let index = 0;
      const srcsize = parseFloat(value);
      index = Math.floor(Math.log(srcsize) / Math.log(1024));
      let size = srcsize / Math.pow(1024, index);
      size = size.toFixed(2);
      return size + unitArr[index];
    } else {
      // return "0 Bytes";
      return "";
    }
  }, []);

  const renderTime = useCallback((timestamp) => {
    if (timestamp && timestamp > 0) {
      const dateTime = new Date(timestamp);
      let hour = dateTime.getHours();
      // if (hour < 10) {
      //   hour = "0" + hour;
      // }
      let minute = dateTime.getMinutes();
      if (minute < 10) {
        minute = "0" + minute;
      }
      return hour + ":" + minute;
    } else {
      return "";
    }
  }, []);

  const utcToTimestamp = useCallback((utcTime) => {
    if (utcTime && utcTime > 0) {
      const secondTemp = Math.floor(utcTime / 1000);
      if (secondTemp > 60) {
        const second = secondTemp % 60;
        if (second > 0) {
          return Math.floor(secondTemp / 60) + "分" + second + "秒";
        } else {
          return Math.floor(secondTemp / 60) + "分";
        }
      } else {
        if (secondTemp === 0) {
          return "1秒";
        } else {
          return secondTemp + "秒";
        }
      }
    } else {
      return "";
    }
  }, []);

  const getColumnDefs = () => {
    return [
      {
        headerName: "data",
        groupId: "data",
        openByDefault: true,
        children: [
          {
            field: "step",
            headerName: "step",
            columnGroupShow: "closed",
          },
          {
            field: "chatId",
            headerName:"chatId",
            columnGroupShow: "closed",
          },
          // {
          //   field: "messageLength",
          //   headerName: "messageLength",
          //   columnGroupShow: "closed",
          // },
          // {
          //   field: "messageIndex",
          //   headerName: "messageIndex",
          //   columnGroupShow: "closed",
          // },
          {
            field: "clientId",
            headerName:"clientId",
            columnGroupShow: "open",
          },
          {
            field: "clientName",
            headerName:"clientName",
            columnGroupShow: "open",
          },
          {
            field: "connent",
            headerName: "connent",
            columnGroupShow: "open",
            cellRenderer: resultRenderer,
          },
          {
            field: "offsetId",
            headerName:"offsetId",
            columnGroupShow: "open",
          },
          {
            field: "dcId",
            headerName: "dcId",
            columnGroupShow: "open",
          },
          {
            field: "category",
            headerName:"category",
            columnGroupShow: "closed",
          },
          {
            field: "messageId",
            headerName:"messageId",
            columnGroupShow: "closed",
          },
          {
            field: "id",
            headerName: "id",
            columnGroupShow: "closed",
          },
          {
            field: "accessHash",
            headerName: "accessHash",
            columnGroupShow: "closed",
          },
        ],
      },
      {
        headerName: "media",
        groupId: "media",
        openByDefault: true,
        children: [
          {
            field: "size",
            headerName: "size",
            columnGroupShow: "open",
            valueFormatter: params => renderSize(params.value),
          },
          {
            field: "fileName",
            headerName: "fileName",
            columnGroupShow: "closed",
          },
          {
            field: "mimeType",
            headerName: "mimeType",
            columnGroupShow: "closed",
          },
          {
            field: "duration",
            headerName: "duration",
            columnGroupShow: "closed",
          },
          {
            field: "width",
            headerName: "width",
            columnGroupShow: "closed",
          },
          {
            field: "height",
            headerName: "height",
            columnGroupShow: "closed",
          },
        ],
      },
      {
        headerName: "photo",
        groupId: "photo",
        openByDefault: true,
        children: [
          {
            field: "mimeType",
            headerName: "mimeType",
            columnGroupShow: "open",
          },
          {
            field: "photoLength",
            headerName: "photoLength",
            columnGroupShow: "closed",
          },
          {
            field: "photoIndex",
            headerName: "photoIndex",
            columnGroupShow: "closed",
          },
        ],
      },
      {
        headerName: "status",
        groupId: "status",
        openByDefault: true,
        children: [
          {
            field: "hashLength",
            headerName: "hashLength",
            columnGroupShow: "open",
          },
          {
            field: "hashIndex",
            headerName: "hashIndex",
            columnGroupShow: "open",
          },
          {
            field: "selectIndex",
            headerName: "selectIndex",
            columnGroupShow: "open",
            cellRenderer: resultRenderer,
          },
          {
            field: "selectFile",
            headerName: "selectFile",
            columnGroupShow: "open",
            cellRenderer: resultRenderer,
          },
          {
            field: "insertFile",
            headerName: "insertFile",
            columnGroupShow: "open",
            cellRenderer: resultRenderer,
          },
          {
            field: "selectMessage",
            headerName: "selectMessage",
            columnGroupShow: "open",
            cellRenderer: resultRenderer,
          },
          {
            field: "insertMessage",
            headerName: "insertMessage",
            columnGroupShow: "open",
            cellRenderer: resultRenderer,
          },
          {
            field: "error",
            headerName: "error",
            columnGroupShow: "open",
          },
          {
            field: "time",
            headerName: "startTime",
            columnGroupShow: "open",
            cellRenderer: params => renderTime(params.value),
          },
          {
            field: "date",
            headerName: "endTime",
            columnGroupShow: "open",
            cellRenderer: params => renderTime(params.value),
          },
          {
            field: "useTime",
            headerName: "useTime",
            columnGroupShow: "open",
            cellRenderer: params => utcToTimestamp(params.value),
          },
          // {
          //   field: "status",
          //   headerName: "status",
          //   columnGroupShow: "open",
          //   cellRenderer: resultRenderer,
          // },
        ],
      },
    ]
  };

  const [colDefs] = useState(getColumnDefs);

  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
      //filter: true,
      width: "100%",
      height: "70%",
      editable: false,
      enableCellChangeFlash: true,
    };
  }, []);

  const autoGroupColumnDef = useMemo(() => {
    return {
      minWidth: 40,
    };
  }, []);

  const rowSelection = useMemo(() => {
    return {
      mode: "multiRow",
      checkboxes: true,
      headerCheckbox: true,
      selectAll: 'filtered',
      enableClickSelection: true,
      // enableSelectionWithoutKeys: true,
      // isRowSelectable: (rowNode) => rowNode.data ? rowNode.data.year < 2007 : false,
    };
  }, []);

  const selectionColumnDef = useMemo(() => { 
    return {
      width: 100,
      // pinned: 'left',
      sortable: true,
      resizable: true,
      suppressHeaderMenuButton: false,
      headerTooltip: 'Checkboxes indicate selection',
    };
  }, []);

  // const onRowSelected = useCallback((event) => {
  //   event.node.isSelected()
  // }, []);

  const onSelectionChanged = useCallback((event) => {
    const selectedNodes = event.selectedNodes;
    if (selectedNodes) {
      const rowCount = selectedNodes.length;
      if (rowCount > 0) {
        console.log(selectedNodes.data);  //测试
        setPauseBtnText("暂停");
      } else {
        setPauseBtnText("开始");
      }
    } else {
      setPauseBtnText("开始");
    }
  }, []);
  
  // const onFirstDataRendered = (params) => {
  //   const nodesToSelect = [];
  //   params.api.forEachNode((node) => {
  //     if (node.data && node.data.year <= 2008 && node.data.year >= 2004) {
  //       nodesToSelect.push(node);
  //     }
  //   });
  //   params.api.setNodesSelected({ nodes: nodesToSelect, newValue: true });
  // };

  const rowClassRules = useMemo(() => {
    return {
      "rag-red": params => params.node.level === 1 && params.node.data.stop === true,
    };
  }, []);

  // const onRowDataUpdated = useCallback((event) => {
  //   const rowNodeIndex = event.node?.rowIndex;
  //   // console.log(rowNodeIndex);  //测试
  //   if (rowNodeIndex > 0) {
  //     gridRef.current.api.ensureIndexVisible(rowNodeIndex, "middle");
  //   }
  // }, []);

  const addNewEvent = useCallback((newItem) => {
    // if (logData.length >= 1000) {
    //   setLogData([]);
    //   console.log("删除log成功");  //测试
    // }
    setLogData((prevState) => {
      // const newList = prevState.slice();
      // //newList.push(newItem);
      // newList.unshift(newItem);
      // // console.log(newList.length);  //测试
      // // console.log(newList);  //测试
      // return newList;
      // return [...prevState, newItem];
      // return [newItem, ...prevState];
      newItem.key = ++key;
      if (prevState.length > 0) {
        return [newItem, ...prevState];
      } else {
        return [newItem];
      }
    });
    // if (logData.length === 0) {
    //   setClearLogBtnDisabled(true);
    // } else {
    //   setClearLogBtnDisabled(false);
    // }
  }, [setLogData, key]);

  const updateItems = useCallback((items) => {
    if (items.date && (items.date >= idArray[items.clientId].rowData.time)) {
      // idArray[items.clientId].rowData.setDataValue("useTime", items.date - idArray[items.clientId].rowData.time);
      idArray[items.clientId].rowData.useTime = items.date - idArray[items.clientId].rowData.time;
    }
    for (const name in items) {
      // console.log(name);  //测试
      // console.log(items[name]);  //测试
      if (name === "error") {
        if (items[name] === true) {
          if (idArray[items.clientId].rowData.error > 0) {
            // idArray[items.clientId].rowData.setDataValue("error", idArray[items.clientId].rowData.error + 1);
            idArray[items.clientId].rowData.error = idArray[items.clientId].rowData.error + 1;
          } else {
            // idArray[items.clientId].rowData.setDataValue("error", 1);
            idArray[items.clientId].rowData.error = 1;
          }
        }
      } else {
        // idArray[items.clientId].rowData.setDataValue(name, items[name]);
        idArray[items.clientId].rowData[name] = items[name];
      }
    }
    setRowData((prevState) => {
      return [...prevState];
    });
  }, []);

  const updateSelect = useCallback((message, name) => {
    if (message.status === "try") {
      // updateItems({
      //   "offsetId": message.offsetId,
      //   [name]: false,
      //   "error": true,
      //   "date": message.date,
      // });
      addNewEvent({
        "error": true,
        "message": renderTime(message.date) + " " + message.offsetId + ":" + message.operate + " - " + message.message,
      });
    } else {
      console.log("未知消息 : " + JSON.stringify(message));
    }
  }, [addNewEvent, renderTime, updateItems]);

  const updateInsert = useCallback((message, name) => {
    if (message.status === "success") {
      updateItems({
        "offsetId": message.offsetId,
        [name]: true,
        "date": message.date,
      });
    } else if (message.status === "error") {
      // updateItems({
      //   "offsetId": message.offsetId,
      //   [name]: false,
      //   "date": message.date,
      // });
      addNewEvent({
        "error": true,
        "message": renderTime(message.date) + " " + message.offsetId + ":" + message.operate + " - " + message.message,
      });
    } else if (message.status === "try") {
      addNewEvent({
        "error": true,
        "message": renderTime(message.date) + " " + message.offsetId + ":" + message.operate + " - " + message.message,
      });
    } else {
      console.log("未知消息 : " + JSON.stringify(message));
    }
  }, [addNewEvent, renderTime, updateItems]);

  const handleBeforeUnload = useCallback((event) => {
    if (!confirm("程序正在运行中，确定要关闭吗？")) {
      event.preventDefault();
    }
  }, []);

  const handlerClose = useCallback(() => {
    for (let clientIndex = 0; clientIndex < clientCount; clientIndex++) {
      clientArray.current[clientIndex].ws = null;
      clientArray.current[clientIndex].stop = true;
      clientArray.current[clientIndex].errorCount += 1;
      if (clientArray.current[clientIndex].errorCount === 10) {
        clientArray.current[clientIndex].waitTime = 300000;
      }
      // console.log("远程websocket连续" + clientArray.current[clientIndex].errorCount + "次断开了连接");  //测试
      addNewEvent({
        "error": true,
        "message": renderTime(Date.now()) + "  >>> 远程websocket连续" + clientArray.current[clientIndex].errorCount + "次断开了连接",
      });
    }
    window.removeEventListener("beforeunload", handleBeforeUnload);
    window.removeEventListener("popstate", handleBeforeUnload);
    setPauseBtnText("开始");
    // setLogData(() => {
    //   return [];
    // });
  }, [addNewEvent, renderTime, handleBeforeUnload]);

  const parseMessage = useCallback((message) => {
    if (message.type === "ping") {
      // console.log("ping");  //测试
    } else if (message.result === "pause") {
      // console.log("远程websocket已停止完毕");  //测试
      addNewEvent({
        "error": true,
        "message": renderTime(Date.now()) + "  >>> 远程websocket已停止完毕",
      });
      idArray.current[message.clientId].ws.close();
      // handlerClose();
    } else if (message.result === "end") {
      // setLogData(() => {
      //   return [];
      // });
      // setClearLogBtnDisabled(true);
      // console.log("当前chat采集完毕");  //测试
      // addNewEvent({
      //   "message": renderTime(Date.now()) + "  >>>当前chat采集完毕",
      //   // "message": renderTime(message.date) + " " + message.operate + " - " + message.message,
      // });
    } else if (message.result === "over") {
      idArray.current[message.clientId].over = true;
      clearTimeout(idArray.current[message.clientId].timeOut);
      // console.log("全部chat采集完毕");  //测试
      // addNewEvent({
      //   "message": renderTime(Date.now()) + "  >>>全部chat采集完毕",
      //   // "message": renderTime(message.date) + " " + message.operate + " - " + message.message,
      // });
    } else {
      if (message.type && message.type === "grid") {
        if (message.clientId && message.clientId > 0) {
          switch (message.operate) {
            case "nextHash":
              if (message.status === "update") {
                if (message.hashIndex && message.hashIndex > 0) {
                  updateItems({
                    "offsetId": message.offsetId,
                    "hashIndex": message.hashIndex,
                    "date": message.date,
                  });
                } else {
                  console.log("hashIndex错误");
                }
              } else if (message.status === "error") {
                // updateItems({
                //   "offsetId": message.offsetId,
                //   "date": message.date,
                // });
                addNewEvent({
                  "error": true,
                  "message": renderTime(message.date) + " " + message.offsetId + ":" + message.operate + " - " + message.message,
                });
              } else if (message.status === "limit") {
                addNewEvent({
                  "error": true,
                  "message": renderTime(message.date) + " " + message.offsetId + ":" + message.operate + " - " + message.message,
                });
              } else {
                console.log("未知消息 : " + JSON.stringify(message));
              }
              break;
            case "getHash":
              if (message.status === "try") {
                // updateItems({
                //   "offsetId": message.offsetId,
                //   "hashIndex": message.hashIndex,
                //   "date": message.date,
                // });
                // if (message.hashIndex === 1) {
                //   addNewEvent({
                //     "error": true,
                //     "message": renderTime(message.date) + " " + message.offsetId + ":" + message.operate + " - 查询首个hash出错 - " + message.message,
                //   });
                // } else if (message.hashIndex > 1) {
                if (message.hashIndex && message.hashIndex > 0) {
                  addNewEvent({
                    "error": true,
                    "message": renderTime(message.date) + " " + message.offsetId + ":" + message.operate + " - 查询hash出错",
                  });
                } else {
                  console.log("hashIndex错误");
                }
              } else {
                console.log("未知消息 : " + JSON.stringify(message));
              }
              break;
            case "nextMessage":
              if (message.status === "error") {
                // if (isCompressChecked === false) {
                //   updateItems({
                //     "offsetId": message.offsetId,
                //     "date": message.date,
                //   });
                // }
                addNewEvent({
                  "error": true,
                  "message": renderTime(message.date) + " " + message.offsetId + ":" + message.operate + " - " + message.message,
                });
              } else if (message.status === "limit") {
                addNewEvent({
                  "error": true,
                  "message": renderTime(message.date) + " " + message.offsetId + ":" + message.operate + " - " + message.message,
                });
              } else {
                console.log("未知消息 : " + JSON.stringify(message));
              }
              break;
            case "start":
            case "nextStep":
              if (message.status === "error") {
                // if (isCompressChecked === false) {
                //   updateItems({
                //     "offsetId": message.offsetId,
                //     "date": message.date,
                //   });
                // }
                addNewEvent({
                  "error": true,
                  "message": renderTime(message.date) + " " + message.offsetId + ":" + message.operate + " - " + message.message,
                });
              } else if (message.status === "limit") {
                addNewEvent({
                  "error": true,
                  "message": renderTime(message.date) + " " + message.offsetId + ":" + message.operate + " - " + message.message,
                });
              } else if (message.status === "flood") {
                addNewEvent({
                  "error": true,
                  "message": renderTime(message.date) + " " + message.offsetId + ":" + message.operate + " - " + message.message,
                });
              } else {
                console.log("未知消息 : " + JSON.stringify(message));
              }
              break;
            case "getMedia":
            case "getPhoto":
            case "getFile":
              if (message.status === "update") {
                const {
                  operate,
                  status,
                  ...temp
                } = message;
                updateItems(temp);
              } else if (message.status === "error") {
                // if (isCompressChecked === false) {
                //   updateItems({
                //     "offsetId": message.offsetId,
                //     "date": message.date,
                //   });
                // }
                addNewEvent({
                  "error": true,
                  "message": renderTime(message.date) + " " + message.offsetId + ":" + message.operate + " - " + message.message,
                });
              } else if (message.status === "indexExist") {
                updateItems({
                  "offsetId": message.offsetId,
                  "selectIndex": true,
                  "date": message.date,
                });
              } else if (message.status === "fileExist") {
                updateItems({
                  "offsetId": message.offsetId,
                  "selectFile": true,
                  "date": message.date,
                });
              } else if (message.status === "cache") {
                addNewEvent({
                  "error": true,
                  "message": renderTime(message.date) + " " + message.offsetId + ":" + message.operate + " - " + message.message,
                });
              } else {
                console.log("未知消息 : " + JSON.stringify(message));
              }
              break;
            case "selectMediaIndex":
              updateSelect(message, "selectIndex");
              break;
            case "insertMedia":
              updateInsert(message, "insertFile");
              break;
            case "insertMediaIndex":
              updateInsert(message, "insertIndex");
              break;
            case "selectPhotoIndex":
              updateSelect(message, "selectIndex");
              break;
            case "insertPhoto":
              updateInsert(message, "insertFile");
              break;
            case "insertPhotoIndex":
              updateInsert(message, "insertIndex");
              break;
            case "endMessage":
            case "endMediaMessage":
            case "endPhotoMessage":
              if (message.status === "try") {
                // updateItems({
                //   "offsetId": message.offsetId,
                //   "date": message.date,
                // });
                addNewEvent({
                  "error": true,
                  "message": renderTime(message.date) + " " + message.offsetId + ":" + message.operate + " - " + message.message,
                });
              } else {
                console.log("未知消息 : " + JSON.stringify(message));
              }
              break;
            case "selectMedia":
            case "selectMediaMessage":
            case "selectPhoto":
            case "selectPhotoMessage":
              updateSelect(message, "selectMessage");
              break;
            case "insertMessage":
              updateInsert(message, "insertMessage");
              break;
            case "endInsert":
            case "endMediaInsert":
            case "endPhotoInsert":
              if (message.status === "exist") {
                updateItems({
                  "offsetId": message.offsetId,
                  "selectMessage": true,
                  "date": message.date,
                });
              } else {
                console.log("未知消息 : " + JSON.stringify(message));
              }
              break;
            case "getMessage":
              if (message.status === "flood") {
                addNewEvent({
                  "error": true,
                  "message": renderTime(message.date) + " " + message.offsetId + ":" + message.operate + " - " + message.message,
                });
              } else if (message.status === "error") {
                // if (isCompressChecked === false) {
                //   updateItems({
                //     "offsetId": message.offsetId,
                //     "date": message.date,
                //   });
                // }
                addNewEvent({
                  "error": true,
                  "message": renderTime(message.date) + " " + message.offsetId + ":" + message.operate + " - " + message.message,
                });
              } else {
                console.log("未知消息 : " + JSON.stringify(message));
              }
              break;
            case "getNext":
            case "waitNext":
            case "forwardMessage":
              addNewEvent({
                "error": message.error,
                "message": renderTime(message.date) + " " + message.offsetId + ":" + message.operate + " - " + message.message,
              });
              break;
            default:
              console.log("未知消息 : " + JSON.stringify(message));
          }
        } else {
          // console.log("消息不包含clientId");
          addNewEvent({
            "error": true,
            "message": renderTime(message.date) + " " + message.offsetId + ":" + message.operate + " 消息不包含clientId" + (message.message ? " - " + message.message  : " "),
          });
        }
      } else {
        addNewEvent({
          "error": message.error,
          "message": renderTime(message.date) + (message.step ? "  (" + message.step + ")":" ") + message.operate + " - " + message.message,
        });
      }
    }
  }, [addNewEvent, renderTime, setLogData, setClearLogBtnDisabled, updateInsert, updateItems, updateSelect, isCompressChecked]);

  const setTime = useCallback((clientIndex) => {
    clearTimeout(clientArray.current[clientIndex].timeOut);
    // let time = 120000;
    // let count = 2;
    // if (documentValue === 1) {
    //   time = 60000;
    //   count = 1;
    // }
    clientArray.current[clientIndex].timeOut = setTimeout(function() {
      if (clientArray.current[clientIndex].over === false) {
        addNewEvent({
          "error": true,
          // "message": renderTime(Date.now()) + "  >>> 过了" + count + "分钟都没有收到任何消息",
          "message": renderTime(Date.now()) + "  >>> 过了1分钟都没有收到任何消息",
        });
        if ((clientArray.current[clientIndex].ws instanceof WebSocket) && clientArray.current[clientIndex].ws.readyState === WebSocket.OPEN) {
          clientArray.current[clientIndex].ws.send(JSON.stringify({
            "command": "close",
          }));
          clientArray.current[clientIndex].ws.close();
          // handlerClose();
        }
      } else {
        // console.log("停止采集，不再继续send");  //测试
        addNewEvent({
          "error": true,
          "message": renderTime(Date.now()) + "  >>> 停止采集，不再继续send",
        });
      }
    // }, time);
    }, 60000);
//  }, [addNewEvent, renderTime, documentValue]);
 }, [addNewEvent, renderTime]);

  const connectWS = useCallback((clientIndex, command) => {
    // console.log("documentValue : " + documentValue);  //测试
    const url = new URL(window.location);
    url.protocol = "wss";
    url.pathname = "/ws";
    clientArray.current[clientIndex].ws = new WebSocket(url);
    if (!(clientArray.current[clientIndex].ws instanceof WebSocket)) {
      clientArray.current[clientIndex].errorCount += 1;
      if (clientArray.current[clientIndex].errorCount === 10) {
        clientArray.current[clientIndex].waitTime = 300000;
      }
      throw new Error("  >>> 连续" + clientArray.current[clientIndex].errorCount + "次连接远程websocket失败");
    }

    clientArray.current[clientIndex].ws.addEventListener("open", () => {
      clientArray.current[clientIndex].stop = false;
      // console.log("连接远程websocket成功，准备send");  //测试
      addNewEvent({
        "message": renderTime(Date.now()) + "  >>> 连接远程websocket成功，准备send",
      });
      if (clientArray.current[clientIndex].errorCount > 0) {
        clientArray.current[clientIndex].errorCount = 0;
        // if (clientArray.current[clientIndex].waitTime !== 30000) {
        //   clientArray.current[clientIndex].waitTime = 30000;
        // }
      }
      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("popstate", handleBeforeUnload);
      // let rowNode = null;
      // gridRef.current.api.forEachNode(function (node) {
      //   rowNode = node;
      //   return;
      // });
      // if (rowNode) {
      //   gridRef.current.api.redrawRows({
      //     rowNodes: [rowNode],
      //   });
      // }
      if ((clientArray.current[clientIndex].ws instanceof WebSocket) && clientArray.current[clientIndex].ws.readyState === WebSocket.OPEN) {
        try {
          clientArray.current[clientIndex].ws.send(command);
          setTime(clientIndex);
        } catch (err) {
          console.log(err);  //测试
          addNewEvent({
            "error": true,
            "message": renderTime(Date.now()) + "  >>> send失败",
          });
          if ((clientArray.current[clientIndex].ws instanceof WebSocket) && clientArray.current[clientIndex].ws.readyState === WebSocket.OPEN) {
            clientArray.current[clientIndex].ws.close();
            // handlerClose();
          }
          // waitReconnect(clientIndex, JSON.stringify({
          //   "command": "start",
          //   "filterType": documentValue,
          // }), clientArray.current[clientIndex].waitTime);
        }
      } else {
        // console.log(command + "失败");  //测试
        addNewEvent({
          "error": true,
          "message": renderTime(Date.now()) + "  >>> " + command + "失败",
        });
      }
    })

    clientArray.current[clientIndex].ws.addEventListener("message", ({ data }) => {
      if (data) {
        let message = null;
        try {
          message = JSON.parse(data);
        } catch (err) {
          // console.log("解析JSON失败");  //测试
          addNewEvent({
            "error": true,
            "message": renderTime(Date.now()) + "  >>> 解析JSON失败",
          });
        }
        if (message) {
          const length = message.length;
          if (length && length > 0) {
            for (let index = 0; index < length; index++) {
              parseMessage(message[index]);
            }
          } else {
            parseMessage(message);
          }
        } else {
          // console.log("message错误");  //测试
          addNewEvent({
            "error": true,
            "message": renderTime(Date.now()) + "  >>> message错误",
          });
        }
      } else {
        console.log("消息为空");
        addNewEvent({
          "error": true,
          "message": renderTime(Date.now()) + "  >>> 消息为空",
        });
      }
      setTime(clientIndex);
    })

    clientArray.current[clientIndex].ws.addEventListener("close", () => {
      handlerClose();
      if (clientArray.current[clientIndex].over === false) {
        // console.log(documentValue);  //测试
        if (clientArray.current[clientIndex].waitTime < 30000) {
          clientArray.current[clientIndex].waitTime = 30000;
        }
        waitReconnect(clientIndex, JSON.stringify({
          "command": "start",
          "filterType": documentValue,
        }), clientArray.current[clientIndex].waitTime);
      }
    })

  }, [addNewEvent, renderTime, handleBeforeUnload, parseMessage, setTime, handlerClose, waitReconnect, documentValue]);

  waitReconnect = useCallback((clientIndex, command, time) => {
    setTimeout(function() {
      if (clientArray.current[clientIndex].over === false) {
        setPauseBtnText("暂停");
        // console.log("连接远程websocket");  //测试
        addNewEvent({
          "message": renderTime(Date.now()) + "  >>> 连接远程websocket",
        });
        try {
          connectWS(clientIndex, command);
        } catch (err) {
          setPauseBtnText("开始");
          // console.log("连接远程websocket失败");  //测试
          addNewEvent({
            "error": true,
            "message": renderTime(Date.now()) + "  >>> 连接远程websocket失败",
          });
          waitReconnect(clientIndex, command, time);
        }
      } else {
        // console.log("停止采集，不再继续send");  //测试
        addNewEvent({
          "error": true,
          "message": renderTime(Date.now()) + "  >>> 停止采集，不再继续send",
        });
      }
    }, time);
  }, [addNewEvent, renderTime, connectWS, waitReconnect]);

  const handlerRadioChange = useCallback((e) => {
    // console.log(parseInt(e.target.value));  //测试
    setDocumentValue(parseInt(e.target.value));
  }, [setDocumentValue]);

  const handlerMessageError = useCallback((message) => {
    addNewEvent({
      "error": true,
      "message": renderTime(Date.now()) + message,
    });
  }, [addNewEvent, renderTime]);

  const handlerPauseBtnClick = useCallback(() => {
    // console.log(pauseBtnText);  //测试
    if (pauseBtnText === "暂停") {
      setPauseBtnText("开始");
      for (let clientIndex = 0; clientIndex < clientCount; clientIndex++) {
        if ((clientArray.current[clientIndex].ws instanceof WebSocket) && clientArray.current[clientIndex].ws.readyState === WebSocket.OPEN) {
          try {
            clientArray.current[clientIndex].ws.send(JSON.stringify({
              "command": "pause",
            }));
          } catch (err) {
            // console.log(err);  //测试
            // setPauseBtnText("暂停");
            handlerMessageError("  >>> pause失败");
          }
        } else {
          // setPauseBtnText("暂停");
          handlerMessageError("  >>> 没有连接ws");
        }
      }
    } else if (pauseBtnText === "开始") {
      // console.log(documentValue);  //测试
      setPauseBtnText("暂停");
      for (let clientIndex = 0; clientIndex < clientCount; clientIndex++) {
        if (!(clientArray.current[clientIndex].ws instanceof WebSocket) || clientArray.current[clientIndex].ws.readyState !== WebSocket.OPEN) {
          waitReconnect(clientIndex, JSON.stringify({
            "command": "start",
            "filterType": documentValue,
          }), 1000);
        }
      }
    }
  }, [setPauseBtnText, handlerMessageError, waitReconnect, pauseBtnText, documentValue]);

  const handlerConnectBtnClick = useCallback(() => {
    setPauseBtnText("开始");
    for (let clientIndex = 0; clientIndex < clientCount; clientIndex++) {
      if ((clientArray.current[clientIndex].ws instanceof WebSocket) && clientArray.current[clientIndex].ws.readyState === WebSocket.OPEN) {
        try {
          clientArray.current[clientIndex].ws.close();
          // handlerClose();
        } catch (err) {
          // console.log(err);  //测试
          // setPauseBtnText("暂停");
          handlerMessageError("  >>> connect失败");
        }
      } else {
        // hsetPauseBtnText("暂停");
        handlerMessageError("  >>> 没有连接ws");
      }
    }
  }, [handlerMessageError]);

  const handlerCloseBtnClick = useCallback(() => {
    setPauseBtnText("开始");
    for (let clientIndex = 0; clientIndex < clientCount; clientIndex++) {
      if ((clientArray.current[clientIndex].ws instanceof WebSocket) && clientArray.current[clientIndex].ws.readyState === WebSocket.OPEN) {
        try {
          clientArray.current[clientIndex].ws.send(JSON.stringify({
            "command": "close",
          }));
        } catch (err) {
          // console.log(err);  //测试
          // setPauseBtnText("暂停");
          handlerMessageError("  >>> close失败");
        }
      } else {
        // setPauseBtnText("暂停");
        handlerMessageError("  >>> 没有连接ws");
      }
    }
  }, [handlerMessageError]);

  const handlerNextBtnClick = useCallback(() => {
    for (let clientIndex = 0; clientIndex < clientCount; clientIndex++) {
      if ((clientArray.current[clientIndex].ws instanceof WebSocket) && clientArray.current[clientIndex].ws.readyState === WebSocket.OPEN) {
        try {
          clientArray.current[clientIndex].ws.send(JSON.stringify({
            "command": "over",
          }));
        } catch (err) {
          // console.log(err);  //测试
          handlerMessageError("  >>> next失败");
        }
      } else {
        handlerMessageError("  >>> 没有连接ws");
      }
    }
  }, [handlerMessageError]);

  const handlerChatBtnClick = useCallback(() => {
    for (let clientIndex = 0; clientIndex < clientCount; clientIndex++) {
      if ((clientArray.current[clientIndex].ws instanceof WebSocket) && clientArray.current[clientIndex].ws.readyState === WebSocket.OPEN) {
        try {
          clientArray.current[clientIndex].ws.send(JSON.stringify({
            "command": "chat",
          }));
        } catch (err) {
          // console.log(err);  //测试
          handlerMessageError("  >>> chat失败");
        }
      } else {
        waitReconnect(clientIndex, JSON.stringify({
          "command": "chat",
        }), 1000);
      }
    }
  }, [handlerMessageError, waitReconnect]);

  const handlerSyncBtnClick = useCallback(() => {
    for (let clientIndex = 0; clientIndex < clientCount; clientIndex++) {
      if ((clientArray.current[clientIndex].ws instanceof WebSocket) && clientArray.current[clientIndex].ws.readyState === WebSocket.OPEN) {
        try {
          clientArray.current[clientIndex].ws.send(JSON.stringify({
            "command": "sync",
          }));
        } catch (err) {
          // console.log(err);  //测试
          handlerMessageError("  >>> sync失败");
        }
      } else {
        waitReconnect(clientIndex, JSON.stringify({
          "command": "sync",
        }), 1000);
      }
    }
  }, [handlerMessageError, waitReconnect]);

  const handlerClearCacheBtnClick = useCallback(() => {
    for (let clientIndex = 0; clientIndex < clientCount; clientIndex++) {
      if ((clientArray.current[clientIndex].ws instanceof WebSocket) && clientArray.current[clientIndex].ws.readyState === WebSocket.OPEN) {
        try {
          clientArray.current[clientIndex].ws.send(JSON.stringify({
            "command": "clear",
          }));
        } catch (err) {
          // console.log(err);  //测试
          handlerMessageError("  >>> clear失败");
        }
      } else {
        handlerMessageError("  >>> 没有连接ws");
      }
    }
  }, [handlerMessageError]);

  const handlerClearLogBtnClick = useCallback(() => {
    setLogData(() => {
      return [];
    });
    setClearLogBtnDisabled(true);
  }, [setLogData, setClearLogBtnDisabled]);

  const handlerCompressChange = useCallback(() => {
    const isCompress = isCompressChecked;
    setCompressChecked(!isCompress);
    for (let clientIndex = 0; clientIndex < clientCount; clientIndex++) {
      if ((clientArray.current[clientIndex].ws instanceof WebSocket) && clientArray.current[clientIndex].ws.readyState === WebSocket.OPEN) {
        try {
          if (isCompress === true) {
            clientArray.current[clientIndex].ws.send(JSON.stringify({
              "command": "noCompress",
            }));
          } else if (isCompress === false) {
            clientArray.current[clientIndex].ws.send(JSON.stringify({
              "command": "compress",
            }));
          }
        } catch (err) {
          // console.log(err);  //测试
          handlerMessageError("  >>> compress失败");
          setCompressChecked(isCompress);
        }
      }
    }
  }, [setCompressChecked, handlerMessageError, isCompressChecked]);

  const handlerBatchChange = useCallback(() => {
    const isBatch = isBatchChecked;
    setBatchChecked(!isBatch);
    for (let clientIndex = 0; clientIndex < clientCount; clientIndex++) {
      if ((clientArray.current[clientIndex].ws instanceof WebSocket) && clientArray.current[clientIndex].ws.readyState === WebSocket.OPEN) {
        try {
          if (isBatch === true) {
            clientArray.current[clientIndex].ws.send(JSON.stringify({
              "command": "noBatch",
            }));
          } else if (isBatch === false) {
            clientArray.current[clientIndex].ws.send(JSON.stringify({
              "command": "batch",
            }));
          }
        } catch (err) {
          // console.log(err);  //测试
          handlerMessageError("  >>> batch失败");
          setBatchChecked(isBatch);
        }
      }
    }
  }, [setBatchChecked, handlerMessageError, isBatchChecked]);

  const inputHandleChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, [setInputValue]);

  const handlerSendBtnClick = useCallback(() => {
    setSendBtnDisabled(true);
    for (let clientIndex = 0; clientIndex < clientCount; clientIndex++) {
      if ((clientArray.current[clientIndex].ws instanceof WebSocket) && clientArray.current[clientIndex].ws.readyState === WebSocket.OPEN) {
        try {
          clientArray.current[clientIndex].ws.send(JSON.stringify({
            "command": inputValue,
          }));
          setInputValue("");
        } catch (err) {
          // console.log(err);  //测试
          handlerMessageError("  >>> send失败");
          setSendBtnDisabled(false);
        }
      } else {
        // handlerMessageError("  >>> 没有连接ws");
        // setSendBtnDisabled(false);
        waitReconnect(clientIndex, inputValue, 1000);
      }
    }
  }, [setSendBtnDisabled, setInputValue, handlerMessageError, waitReconnect, inputValue]);

  useEffect(() => {
    if (logData.length === 0) {
      setClearLogBtnDisabled(true);
    } else if (logData.length >= 1000) {
      setLogData(() => {
        return [];
      });
      setClearLogBtnDisabled(false);
      console.log("删除log成功");  //测试
    } else {
      setClearLogBtnDisabled(false);
    }
//    return () => {
//    }
  },[setClearLogBtnDisabled, setLogData, logData]);

  useEffect(() => {
    if (inputValue) {
      setSendBtnDisabled(false);
    } else {
      setSendBtnDisabled(true);
    }
//    return () => {
//    }
  },[setSendBtnDisabled, inputValue]);

  // const addItems = useCallback((items) => {
  //   const res = gridRef.current.api.applyTransaction({
  //     add: items
  //   });
  //   // console.log(res);  //测试
  //   if (!res.add || res.add.length <= 0) {
  //     console.log("添加row失败");
  //     addNewEvent({
  //       "message": renderTime(Date.now()) + "  >>> 添加row失败",
  //     });
  //     // console.log(items);  //测试
  //   }
  // }, [addNewEvent, renderTime]);

  // useEffect(() => {
  //   if (clientCount > 0) {
  //     // for (let clientIndex = 0; clientIndex < clientCount; clientIndex++) {
  //     //   addItems([urlArray[clientIndex]]);
  //     // }
  //     addItems(urlArray);
  //   }
  // },[clientCount, addItems]);

  // useEffect(() => {
  //   const handleBeforeUnload = (event) => {
  //     if (!confirm("程序正在运行中，确定要关闭吗？")) {
  //       event.preventDefault();
  //     }
  //   };
  //   window.addEventListener("beforeunload", handleBeforeUnload);
  //   return () => {
  //     window.removeEventListener("beforeunload", handleBeforeUnload);
  //   };
  // }, []);

  return (
    <div style={containerStyle}>
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={gridStyle}>
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={colDefs}
            defaultColDef={defaultColDef}
            getRowId={getRowId}
            rowClassRules={rowClassRules}
            rowSelection={rowSelection}
            selectionColumnDef={selectionColumnDef}
            // onRowSelected={onRowSelected}
            onSelectionChanged={onSelectionChanged}
            // onFirstDataRendered={onFirstDataRendered}
            // onRowDataUpdated={onRowDataUpdated}
            // pagination={pagination}
            // paginationPageSize={paginationPageSize}
            // paginationPageSizeSelector={paginationPageSizeSelector}
            autoGroupColumnDef={autoGroupColumnDef}
            groupDefaultExpanded={1}
          />
        </div>
        <div style={{ width: "100%", height: "5%" }}>
          <label>
            <input type="radio" name="filterType" value="0" checked={documentValue === 0} onChange={handlerRadioChange} />
            媒体
          </label>
          <label>
            <input type="radio" name="filterType" value="1" checked={documentValue === 1} onChange={handlerRadioChange} />
            图片
          </label>
          <label>
            <input type="radio" name="filterType" value="2" checked={documentValue === 2} onChange={handlerRadioChange} />
            视频
          </label>
          <label>
            <input type="radio" name="filterType" value="3" checked={documentValue === 3} onChange={handlerRadioChange} />
            文件
          </label>
          <label>
            <input type="radio" name="filterType" value="4" checked={documentValue === 4} onChange={handlerRadioChange} />
            动图
          </label>
          <button onClick={handlerPauseBtnClick} disabled={true}>{pauseBtnText}</button>
          <button onClick={handlerConnectBtnClick} disabled={true}>断开</button>
          <button onClick={handlerCloseBtnClick} disabled={true}>强制关闭</button>
          <button onClick={handlerNextBtnClick} disabled={true}>不再继续</button>
          <button onClick={handlerChatBtnClick}>chat</button>
          <button onClick={handlerSyncBtnClick}>sync</button>
          <button onClick={handlerClearCacheBtnClick}>清空cache</button>
          <button onClick={handlerClearLogBtnClick} disabled={isClearLogBtnDisabled}>清空log</button>
          <label>
            <input type="checkbox" checked={isCompressChecked} onChange={handlerCompressChange} />
            压缩
          </label>
          <label>
            <input type="checkbox" checked={isBatchChecked} onChange={handlerBatchChange} />
            批量
          </label>
          <input type="text" value={inputValue} onChange={inputHandleChange} />
          <button onClick={handlerSendBtnClick} disabled={isSendBtnDisabled}>发送</button>
        </div>
        <div style={{ width: "100%", height: "20%", minHeight: 0, flexGrow: 1, overflow: "auto" }}>
          {/* <h4>日志</h4> */}
            <ul>
              {logData.map((item) => (
                item.error ? 
                  <li key={item.key} style={{ color: "red" }}>{item.message}</li> : 
                  <li key={item.key}>{item.message}</li>
              ))}
            </ul>
        </div>
      </div>
    </div>
  );
};

export default App
