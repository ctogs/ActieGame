import { useEffect, useRef, useState } from "react"
import { Player } from "../helpers/types"
import { collection, doc, onSnapshot } from "firebase/firestore"
import { db } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";

export function LeaderBoard() {
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const gameRoomsRef = collection(db, 'gameRooms');
  const URLparams = useParams();
  const roomID = URLparams.roomID

  useEffect(() => {
    const unsub = onSnapshot(doc(gameRoomsRef, roomID), (doc) => {
      const docData = doc.data();
      if (docData) {
        setPlayers(docData.players)
      }
    })
  }, [])

  return (
    <>
      {Object.entries(players).sort(([,a], [,b]) => 
        b.points - a.points
      ).
      map(([key, value], index) => 
         (
          <div key={key}>
            {index + 1}: {value.displayName} - {value.points}
          </div>
        )
      )}
    </>
  )
}