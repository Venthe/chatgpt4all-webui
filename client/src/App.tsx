import React, { useState } from 'react';
import './App.css';
import useWebSocket from 'react-use-websocket';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table'
import Card from 'react-bootstrap/Card';
import ButtonGroup from 'react-bootstrap/ButtonGroup';

const socketUrl = 'ws://localhost:8765';

function App() {
  const [response, setState] = useState({});

  const {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    lastJsonMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(socketUrl, {
    onOpen: () => console.debug('opened'),
    //Will attempt to reconnect on all close events, such as server shutting down
    shouldReconnect: (closeEvent) => true,
    onMessage: ({ data }) => {
      // console.log(data, typeof data, data.type, data.type !== 'response')
      data = typeof data === 'string' ? JSON.parse(data) : data
      // console.log(data)
      if (data.type === 'response') {
        setState(state => {
          let newState = JSON.parse(JSON.stringify(state))
          if (newState[data.correlationId] == undefined) {
            newState[data.correlationId] = {}
          }
          if (newState[data.correlationId].date == undefined) {
            newState[data.correlationId].date = new Date()
          }
          if (newState[data.correlationId].state == undefined) {
            newState[data.correlationId].state = ""
          }
          if (newState[data.correlationId].prompt == undefined) {
            newState[data.correlationId].prompt = data.prompt
          }
          // @ts-ignore
          newState[data.correlationId].state = newState[data.correlationId].state + data.payload
          return newState
        })
      }
    }
  });

  function onSubmit(e: any) {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      return;
    }
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    sendJsonMessage({ ...data, type: "prompt" })
  }

  function stop() {
    sendJsonMessage({ type: 'stop' })
  }

  function clear() {
    setState(state => ({}))
  }

  function getAnswersAsRows() {
    // @ts-ignore
    return Object.keys(response)
      // @ts-ignore
      .map(key => ({ ...(response[key] ?? {}), key }))
      // @ts-ignore
      .sort((a, b) => new Date(a.date).getTime() < new Date(b.date).getTime())
  }

  // @ts-ignore
  function deleteRow(id) {
    setState(state => {
      let newState = JSON.parse(JSON.stringify(state))
      delete newState[id]
      return newState
    })
  }

  return (
    <Container fluid className="mt-5">
      <Row className='me-1 mb-4'>
        <Col>
          <Form onSubmit={onSubmit}>
            <Form.Group controlId="promptGroup">
              <Container>
                <Row className='me-1'>
                  <Col md="1" className='d-flex justify-content-center align-items-center'>
                    <Form.Label className=' mb-0'>Prompt</Form.Label>
                  </Col>
                  <Col md="8">
                    <Form.Control type="text" placeholder="Enter prompt" name="prompt" />
                  </Col>
                  <Col md="3">
                    <ButtonGroup className="d-flex">
                      <Button variant="primary" type="submit">
                        Submit
                      </Button>
                      <Button variant="secondary" type="button" onClick={clear}>
                        Clear
                      </Button>
                      <Button variant="warning" type="button" onClick={stop}>
                        Stop
                      </Button>
                    </ButtonGroup>
                  </Col>
                </Row>
              </Container>
            </Form.Group>
          </Form>
        </Col>
      </Row>
      {
        getAnswersAsRows().map(el => (
          <Row className='me-1 mb-2'>
            <Col>
              <Card>
                <Card.Body>
                  <Card.Header>
                    <Container>
                      <Row fluid>
                        <Col className='d-flex align-items-center'>
                          <span className='cap'>Prompt:</span>&nbsp;<span className="sub">{el.prompt}</span>
                        </Col>
                        <Col md='2'>
                          <ButtonGroup className="d-flex">
                            <Button onClick={() => deleteRow(el.key)} type="button" variant="outline-primary">Delete</Button>
                          </ButtonGroup>
                        </Col>
                      </Row>
                    </Container>
                  </Card.Header>
                  <Card.Text className="css-fix">
                    {el.state}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ))
      }
    </Container >
  );
}

export default App;
