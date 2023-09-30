import { useNavigate } from "react-router-dom"
import { auth } from "../firebase";
import { useAuthState } from 'react-firebase-hooks/auth'
import { GoogleAuthProvider, signInWithPopup } from '@firebase/auth'
import { collection } from "firebase/firestore";
import { db } from "../firebase";
import { addUser, createGameRoom } from "../helpers/database";


export function Home() {
  const navigate = useNavigate()
  const [user] = useAuthState(auth)
  const usersRef = collection(db, 'users')
  const gameRoomsRef = collection(db, 'gameRooms')
  
  const createGame = async () => {
    const isHost = true
    if (user) {
      await addUser(usersRef, user, isHost)
      const roomID = await createGameRoom(gameRoomsRef, user)
      navigate(`/host-waitroom/${roomID}`)
    } else {
      throw new Error("no user");
    }
  }
  
  const joinGame = async () => {
    const isHost = false
    if (user) await addUser(usersRef, user, isHost)
    else throw new Error("No user")
    navigate('/join')
  }

  return (
    <>
      <div>
        <SignOut />
      </div>
      <div className="actie-header">
        <h1>Actie!</h1>
        <h2>A Movie Guessing Game</h2>
      </div>
      {user ? 
        <div>    
          <button onClick={createGame}>create game</button>
          <button onClick={joinGame}>join a game</button>
        </div>
         :
        <SignIn />
      }
    </>
  )
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  }

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
    </>
  )

}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
  )
}