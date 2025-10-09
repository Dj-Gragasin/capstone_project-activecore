import React, { useEffect } from "react";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Route, Redirect } from "react-router-dom";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";

/* Import pages */
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import MemberDashboard from "./pages/MemberDashboard";
import Payment from "./pages/Payment";
import MyAttendance from "./pages/MyAttendance";
import Calorie from "./pages/Calorie";
import RegisterMember from "./pages/RegisterMember";
import QrAttendance from "./pages/QrAttendance";
import ProgressTracker from "./pages/ProgressTracker"; // Updated import path
import MuscleGainTracker from "./pages/MuscleGainTracker";

setupIonicReact();

const App: React.FC = () => {
  useEffect(() => {
    document.body.classList.add("dark");
    document.documentElement.classList.add("ion-palette-dark");
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/home" component={Home} />
          <Route exact path="/admin" component={AdminDashboard} />
          <Route exact path="/member" component={MemberDashboard} />
          <Route exact path="/myattendance" component={QrAttendance} />
          <Route exact path="/payment" component={Payment} />
          <Route exact path="/attendance" component={MyAttendance} />
          <Route exact path="/qrattendance" component={QrAttendance} />
          <Route exact path="/calorie" component={Calorie} />
          <Route exact path="/register" component={RegisterMember} />
          {/* Add the new Progress Tracker route */}
          <Route exact path="/progress" component={ProgressTracker} />
          <Route exact path="/muscle-gain" component={MuscleGainTracker} />
          <Route exact path="/" render={() => <Redirect to="/home" />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;