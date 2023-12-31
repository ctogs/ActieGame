import { useEffect, useState } from "react"
import { Player } from "../helpers/types"
import { collection, doc, onSnapshot } from "firebase/firestore"
import { db } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";

export function WaitingRoom() {
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const navigate = useNavigate();
  const gameRoomsRef = collection(db, 'gameRooms');
  const URLparams = useParams();
  const roomID = URLparams.roomID

  useEffect(() => {
    const unsub = onSnapshot(doc(gameRoomsRef, roomID), (doc) => {
      const docData = doc.data();
      if (docData) {
        setPlayers(docData.players)

        // if game is started, go to roomID
        if(docData.start == true) navigate(`/player/${roomID}`)
      }
    })

    return () => {
      unsub();
    }
  }, [])

  return (
    <>
      <h1>Waiting Room</h1>
      {Object.entries(players).map(([key, value]) => 
         (
          <div key={key} className="actie-header">
            <div className="player-name">
              {value.displayName}
            </div>
          </div>
        )
      )} <br />
    </>
  )
}