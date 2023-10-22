import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { Ollama } from "langchain/llms/ollama";
import { v4 as uuidv4 } from 'uuid';
import { FluentProvider, teamsDarkTheme, Button  } from '@fluentui/react-components';
import {
  Body1,
  Caption1,
} from "@fluentui/react-components";
import {
  makeStyles,
  shorthands,
  Input,
  Label,
  useId,
  Field,
  RadioGroup,
  Radio,
  Spinner,
  Avatar,
  Toaster,
  useToastController,
  Toast,
  ToastBody, ToastTitle,
  ToastIntent, Card, CardHeader, CardPreview
} from "@fluentui/react-components";

const createUniqueId = (): string => {
  return uuidv4()
}

interface RequestResponse {date: Date, query: string, response: string[]}

function App() {
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);
  const error = (data: string) => dispatchToast(
    <Toast>
      <ToastTitle>Error</ToastTitle>
      <ToastBody subtitle="Subtitle">{data}</ToastBody>
    </Toast>,
    { intent: "error" }
  );


  const ollamaClient = OllamaClient()
  const {sendMessage, clearHistory, chatHistory, deleteId} = OllamaApi(ollamaClient)

  function onSubmit(e: any) {
    e.preventDefault();

    const form = e.target;
    // if (form.checkValidity() === false) {
    //   return;
    // }

    if(sendMessage === undefined) error("!")

    sendMessage?.(form.prompt.value as string)
  }

  function clear() {
    clearHistory?.()
  }

  // @ts-ignore
  const deleteRow = (id: string) =>  deleteId?.(id)

  const history = () => {
    return Object.keys(chatHistory ?? {})
    .map(key => ({key, value: chatHistory?.[key]}))
    .sort((a: {key: string, value: RequestResponse | undefined}, b: {key: string, value: RequestResponse | undefined}) => (b.value?.date.getTime() ?? 0) - (a.value?.date.getTime() ?? 0))
    .map(({key, value}: {key: string, value: RequestResponse | undefined}) => {
      return  (<>
      <Card key={key} style={{padding: "1rem", background:"var(--colorNeutralBackground2)"}}>
      <CardHeader style={{padding: "1rem", background:"var(--colorNeutralBackground3)"}}
        header={<>
          <div style={{display: "flex", justifyContent: "space-between", width:"100%"}}><span>{value?.query}</span><Button onClick={() => deleteRow(key)}>Delete</Button></div>
          </>}
        description={<Caption1>{key}</Caption1>}
      />
      <CardPreview  style={{padding: "1rem"}} >
        <div style={{whiteSpace: "pre-line"}}>{value?.response.join("")}</div>
      </CardPreview>
      </Card>
      </>
    )
    })
  }

  const ModelPicker = () => <div>Model picker</div>
  const Prompt = () =>{
    return (
    <div>
      <form onSubmit={onSubmit}>
    <Label htmlFor="prompt">
        Sample input
      </Label>
      <Input id="prompt" />
      <Button type="submit">Send</Button>
      </form>
  </div>
  )
  }

  return (
    <FluentProvider style={{width: "100%", height: "100%"}} theme={teamsDarkTheme}>
    <div style={{padding: "1rem", width: "100%", maxHeight:"100%", height: "100%", overflow: "hidden", background: "var(--colorNeutralBackground1)", display:"grid", gridTemplateRows: "3rem minmax(0, 1fr) 1rem"}}>
      <div><ModelPicker/></div>
      <div style={{overflowY: "scroll"}}>{history()}</div>
      <div><Prompt/></div>
  </div>
  
  <Toaster toasterId={toasterId} />
  </FluentProvider>
  );
}

export default App;

const OllamaClient = () => {
  // setup client
  // TODO: Variable model
  // TODO: Variable URL
  const [state, setState] = useState<Ollama | undefined>(undefined);
  useEffect(() => {
    setState(new Ollama({
      baseUrl: "http://localhost:11434",
      model: "mistral-openorca"
    }))
  }, []);

  return state
}

const OllamaApi = (client: Ollama | undefined) => {
  const [chatHistory, setChatHistory] = useState<{[key: string]: RequestResponse}>({});
  
  if(!client) return {}

  const clearHistory = () => setChatHistory({})
  const appendChunk = (chunk: string, id: string) => {
    setChatHistory(previous => {
      if(!previous[id]) return previous
      const previousForId = {...previous[id]}
      if(previousForId === undefined) throw new Error("State should never be empty when applying chunks")
      previousForId.response = [...previousForId.response, chunk] 

      const newState = {...previous}
      newState[id] = previousForId
      return newState
    })
  }
  const createRequestState = (query: string) => {
    const request: RequestResponse = {
      date: new Date(),
      query,
      response: [] as string[]
    }

    const id = createUniqueId()

    setChatHistory(previous => {
      const p = {...previous}
      p[id] = request
      return p
    })

    return id
  }

  const sendMessage = (prompt: string) => {
    const id = createRequestState(prompt)
    client.stream(prompt).then(rb => {
      const reader = rb.getReader()
      return new ReadableStream({
        start(controller) {
          // The following function handles each data chunk
          function push() {
            // "done" is a Boolean and value a "Uint8Array"
            reader.read().then(({ done, value }) => {
              // If there is no more data to read
              if (done) {
                console.log("done", done);
                // controller.close();
                return;
              }
              // Get the data and send it to the browser via the controller
              controller.enqueue(value);
              // Check chunks by logging to the console
              appendChunk(value, id)
              // console.log(done, value);
              push();
            });
          }
  
          push();
        },
      });
    })
  }

  const deleteId = (id: string) => setChatHistory(chatHistory => {
    const newChatHistroy = {...chatHistory}
    delete newChatHistroy[id]

    return newChatHistroy
  }) 
  
  return {sendMessage, clearHistory, chatHistory, deleteId}
}