import { useEffect, useRef, useState } from "react";
import { endGame, isCorrectGuess, makeNewRound, updateRoundWinner, updatePlayerPoints } from "../helpers/database";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";
import { useTimer } from 'use-timer'
import { useAuthState } from "react-firebase-hooks/auth";
import Popup from "reactjs-popup";
import { LeaderBoard } from "./LeaderBoard";


export function GameHost() {
  const navigate = useNavigate();
  const numRounds = useRef(0);
  const gameRoomsRef = collection(db, 'gameRooms');
  const URLparams = useParams();
  const roomID = URLparams.roomID

  const [actor1Name, setActor1Name] = useState("");
  const [actor2Name, setActor2Name] = useState("");
  const [actor1ImageURL, setActor1ImageURL] = useState("");
  const [actor2ImageURL, setActor2ImageURL] = useState("");
  const [movies, setMovies] = useState<string[]>([]);
  const [formValue, setFormValue] = useState("");
  const [user] = useAuthState(auth);
  const [roundWinner, setRoundWinner] = useState("");
  const [correctRoundGeuss, setCorrectRoundGuess] = useState("");

  const [open, setOpen] = useState(false);
  const closeModal = () => setOpen(false);

  const { time, start, reset } = useTimer({
    initialTime: 15,
    timerType: "DECREMENTAL",
    endTime: 0,
    onTimeOver: async () => {
      if (numRounds.current > 10) {
        reset();
        await endGame(gameRoomsRef, roomID)
      } else {
        numRounds.current += 0.5;
        reset();
        await updateRoundWinner(gameRoomsRef, roomID, "No one", "Get it right then you'll see...");
        await makeNewRound(gameRoomsRef, roomID);
        showLeaderBoardThenStart();
      }
    }
  });

  useEffect(() => {
    start();
    const unsub = onSnapshot(doc(gameRoomsRef, roomID), (doc) => {
      const docData = doc.data();
      if (docData) {
        if (!docData.start){
          navigate(`/leaderboard/${roomID}`)
        } else if(numRounds.current > 10){
          (async () => {
            await endGame(gameRoomsRef, roomID)
          }) ();
        } else {
          reset();
          showLeaderBoardThenStart();   
          numRounds.current += 0.5
          setActor1Name(docData.actor1Name)
          setActor2Name(docData.actor2Name)
          setActor1ImageURL(docData.actor1Image)
          setActor2ImageURL(docData.actor2Image)
          setMovies(docData.movies)    
          setRoundWinner(docData.roundWinner);     
          setCorrectRoundGuess(docData.correctRoundGuess); 
        }
      }
    })

    return () => {
      unsub();
    };
  }, [])

  const makeAGuess = () => {
    movies.forEach(async (movie) => {
      if (isCorrectGuess(formValue, movie) && user && user.displayName) {
        if (numRounds.current > 10) {
          await endGame(gameRoomsRef, roomID);
        } else {
          await updateRoundWinner(gameRoomsRef, roomID, user.displayName, movie);
          await updatePlayerPoints(gameRoomsRef, roomID, user, time)
          await makeNewRound(gameRoomsRef, roomID)
          setFormValue("")
        }
      } else {
        setFormValue("")
      }
    })
  }

  const showLeaderBoardThenStart = () => {
    setOpen(true)
    setTimeout(() => {
      setOpen(false);
      start();
    }, 7000);
  }

  return (
    <>
      <h1>Host</h1>
      <h3>{user?.displayName}</h3>
      <h2>Round: {numRounds.current}</h2>
      <div>
      <Popup open={open} closeOnDocumentClick={false} onClose={closeModal} closeOnEscape={false} lockScroll>
        <div className="modal">
          {roundWinner === "" ? 
            <div>
              <h2>Get ready to start...</h2>
            </div> :
            <div>
              <h2>{roundWinner} guessed correctly!</h2>
              <h2>A correct answer: {correctRoundGeuss}</h2>
            </div>
          }
            <LeaderBoard />              
        </div>
      </Popup>
      </div> <br />

      <div className="actor-container">
        <div className="actor">
          <img src={actor1ImageURL} alt="actor1img" />
          <div className="actie-header">
            <h3>{actor1Name}</h3> 
          </div>
        </div>
        <div className="actor">
          <img src={actor2ImageURL} alt="actor2img" /> 
          <div className="actie-header">
            <h3>{actor2Name}</h3> 
          </div>
        </div>
      </div>

      {time} seconds remaining <br />
      <form onSubmit={(e) => e.preventDefault()}>
        <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="What's your guess?" /><br></br>
        <button onClick={makeAGuess}>Guess</button>
      </form>
    </>
  )
}