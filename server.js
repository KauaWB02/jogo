/** @format */

const express = require('express');
const http = require('http');
const { json } = require('stream/consumers');
const WebSocket = require('ws');
const app = express();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clientsConnected = [];

let rooms = [
  {
    id: 1,
    name: "Sala 01",
    status: "Aberta",
    players: []
  },
  {
    id: 2,
    name: "Sala 02",
    status: "Aberta",
    players: []
  },
  {
    id: 3,
    name: "Sala 03",
    status: "Aberta",
    players: []
  }
]

let playerIdCounter = 0;

wss.on('connection', function connection(ws) {

  console.log(ws);

  ws.send(JSON.stringify({ type: "ROOMS_LIST", rooms: rooms }));
  clientsConnected.push(ws);

  ws.on('message', function incoming(message) {
    const { playerName, type, room } = JSON.parse(message);
    setPlayer(playerName, ws)
    switch (type) {
      case "JOIN_ROOM":
        const playerConnected = playerIsAlreadyConnected(ws);

        if (!playerConnected) {
          joinRoom(playerName, ws, room);
        } else {
          sendMessagePlayer(ws, { type: 'MESSAGE', message: 'Você já está conectado em uma sala.', room: playerConnected })
        }

        broadcast({ type: "ROOMS_LIST", rooms: rooms });
        break;

      default:
        break;
    }
  })

  ws.on('close', () => {
    for (const room of rooms) {
      const index = room.players.findIndex(p => p.webSocket === ws);
      if (index !== -1) {
        room.status = "Aberta"
        room.players.splice(index, 1); // Remove o jogador do array
        break; // Sair do loop depois de encontrar e remover o jogador
      }
    }

    clientsConnected = clientsConnected.filter(room => room !== ws);
    broadcast({ type: "ROOMS_LIST", rooms: rooms });
  });
});

function sendMessagePlayer(ws, objectMessage) {
  ws.send(JSON.stringify({ ...objectMessage }))
}

function playerIsAlreadyConnected(ws) {
  const playerConnected = rooms.find((value) => {
    return value.players.some((playersConnected) => playersConnected.webSocket === ws);
  });

  return playerConnected ? {
    id: playerConnected.id,
    name: playerConnected.name,
    status: playerConnected.status,
  } : undefined;
}

function getRoom(index) {
  return rooms[index];
}

function getPlayer(indexRoom, indexPlayer) {
  return rooms[indexRoom].players[indexPlayer];
}

function joinRoom(playerName, ws, room) {
  const indexRoom = rooms.findIndex((value) => value.name === room.name);
  if (indexRoom !== -1) {
    if (getRoom(indexRoom).players.length === 2) {
      ws.send(JSON.stringify({ type: "MESSAGE", message: 'Essa sala está cheia.' }))
      return;
    }

    playerIdCounter++;
    const objectExemploPlayer = {
      id: playerIdCounter,
      name: playerName,
      webSocket: ws,
    }

    rooms[indexRoom].players.push(objectExemploPlayer);

    if (rooms[indexRoom].players.length === 2) {
      ws.send(JSON.stringify({ type: "MESSAGE", message: 'Você conectou' }))
      rooms[indexRoom].status = "Full";
    }

  }


  // if (!existRoom) {
  //   roomIdCounter++;
  //   const objectExemploRoom = {
  //     id: roomIdCounter,
  //     name: room.name,
  //     status: "Aberta",
  //     players: []
  //   };

  //   playerIdCounter++;
  //   const objectExemploPlayer = {
  //     id: playerIdCounter,
  //     name: playerName,
  //     webSocket: ws,
  //   }

  //   objectExemploRoom.players.push(objectExemploPlayer);
  //   roomsAndPlayers.push(objectExemploRoom)
  //   ws.send(JSON.stringify({ message: `Bem vindo ${playerName}, você se conectou na sala ${room.name} ` }))
  // } else {
  //   const indexRoom = rooms.findIndex((value) => value.name === room.name);

  //   const playerIsAlreadyConnected = roomsAndPlayers.some((value) => {
  //     return value.players.some((playersConnected) => playersConnected.name === playerName)
  //   })

  //   if (playerIsAlreadyConnected) {
  //     ws.send(JSON.stringify(
  //       {
  //         message: `${playerName}, Você já está conectado em uma sala. `,
  //         playerName,
  //         room: { name: room.name }
  //       }))
  //     return;
  //   } else {

  //     const objectExemploRoom = {
  //       id: indexRoom + 1,
  //       name: room.name,
  //       status: "Aberta",
  //       players: []
  //     };

  //     playerIdCounter++;
  //     const objectExemploPlayer = {
  //       id: playerIdCounter,
  //       name: playerName,
  //       webSocket: ws,
  //     }

  //     objectExemploRoom.players.push(objectExemploPlayer);
  //     roomsAndPlayers.push(objectExemploRoom)
  //     rooms[indexRoom].status = "Full";
  //     ws.send(JSON.stringify({ type: "ROOMS_LIST", rooms: rooms }))

  //   }

  //   console.log(roomsAndPlayers)

  // }


}

function setPlayer(playerName, ws) {
  rooms.map((value) => {
    const player = value.players.find((value) => value.name === playerName);
    if (player) {

      player.webSocket = ws;
      sendMessagePlayer(ws, { type: 'INSIDE_THE_HALL', message: 'Você já está conectado em uma sala.', room: value })
    }
  })
}

function broadcast(message) {
  clientsConnected.forEach((client) => {
    client.send(JSON.stringify(message))
  }
  )
}

app.get('/', (req, res) => {
  res.send('Hello World!');
});

server.listen(8080, () => {
  console.log('Server started on http://localhost:8080');
});
