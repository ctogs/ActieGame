import { useNavigate } from "react-router-dom"
import { useState } from "react";
import { auth, db } from "../firebase";
import { addUserToRoom } from "../helpers/database";
import { collection } from "firebase/firestore";

export function Join() {
  const navigate = useNavigate()
  const [formValue, setFormValue] = useState("")
  const gameRoomsRef = collection(db, 'gameRooms')

  const goToWaitRoom = async () => {
    if (!auth.currentUser) throw new Error("No user")
    await addUserToRoom(gameRoomsRef, auth.currentUser, formValue)
    navigate(`/waiting-room/${formValue}`)
  }
  return (
    <>
      <h1>Join</h1>
      <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Room ID" /><br></br>
      <button onClick={goToWaitRoom}>join the game!</button>
    </>
  )
}