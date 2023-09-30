import { collection, onSnapshot, doc } from "firebase/firestore";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../firebase";
import { isCorrectGuess, makeNewRound, updatePlayerPoints, updateRoundWinner } from "../helpers/database";
import { useAuthState } from "react-firebase-hooks/auth";
import { useTimer } from "use-timer";
import Popup from "reactjs-popup";
import { LeaderBoard } from "./LeaderBoard";

export function GamePlayer() {
  const navigate = useNavigate();
  const numRounds = useRef(0);
  const [actor1Name, setActor1Name] = useState("");
  const [actor2Name, setActor2Name] = useState("");
  const [actor1ImageURL, setActor1ImageURL] = useState("");
  const [actor2ImageURL, setActor2ImageURL] = useState("");
  const [movies, setMovies] = useState<string[]>([]);
  const [formValue, setFormValue] = useState("");
  const [user] = useAuthState(auth);

  const gameRoomsRef = collection(db, 'gameRooms');
  const URLparams = useParams();
  const roomID = URLparams.roomID
  const [roundWinner, setRoundWinner] = useState("");
  const [correctRoundGeuss, setCorrectRoundGuess] = useState("");

  const [open, setOpen] = useState(false);
  const closeModal = () => setOpen(false);

  const { time, start, reset } = useTimer({
    initialTime: 15,
    timerType: "DECREMENTAL",
    endTime: 0,
    onTimeOver: async () => {
      numRounds.current += 0.5;
      reset();
      showLeaderBoardThenStart();
    }
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(gameRoomsRef, roomID), (doc) => {
      const docData = doc.data();
      if (docData) {
        if (!docData.start) navigate(`/leaderboard/${roomID}`)
        numRounds.current += 0.5;
        setActor1Name(docData.actor1Name)
        setActor2Name(docData.actor2Name)
        setMovies(docData.movies)
        setActor1ImageURL(docData.actor1Image)
        setActor2ImageURL(docData.actor2Image)
        setRoundWinner(docData.roundWinner);     
        setCorrectRoundGuess(docData.correctRoundGuess); 
        reset();
        showLeaderBoardThenStart();
      }
    })

    return () => {
      unsub();
    }
  }, [])

  const makeAGuess = () => {
    movies.forEach(async (movie) => {
      if (isCorrectGuess(formValue, movie) && user && user.displayName) {
        await updateRoundWinner(gameRoomsRef, roomID, user.displayName, movie);
        await updatePlayerPoints(gameRoomsRef, roomID, user, time)
        await makeNewRound(gameRoomsRef, roomID)
        setFormValue("")
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
      <h1>Player</h1>
      <h3>{user?.displayName}</h3>
      <h2>Round: {numRounds.current}</h2>
      <div>
        <Popup open={open} closeOnDocumentClick={false} onClose={closeModal} closeOnEscape={false} lockScroll>
          <div className="modal">
            <h2>{roundWinner} guessed correctly!</h2>
            <h2>They guessed: {correctRoundGeuss}</h2>
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