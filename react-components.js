// Component to manage which test is shown
const TestManager = () => {
  const [activeTest, setActiveTest] = React.useState(null);
  
  // Function to be exposed globally
  window.loadTest = (testId) => {
    setActiveTest(testId);
  };
  
  // Render the appropriate test component based on the active test
  const renderTest = () => {
    switch(activeTest) {
      case 'head': return <CognitiveTest />;
      case 'chest': return <CardiovascularTest />;
      case 'abdomen': return <BodyCompositionTest />;
      case 'leftArm': 
      case 'rightArm': return <ReactionTest />;
      case 'leftLeg':
      case 'rightLeg': return <StabilityTest />;
      default: return <WelcomeScreen />;
    }
  };
  
  return (
    <div className="test-panel">
      {renderTest()}
    </div>
  );
};

// Welcome screen shown initially with personalized message
const WelcomeScreen = () => (
  <div className="sci-panel p-6 info-card show text-gray-200">
    <h2 className="text-xl font-bold mb-4 text-blue-400">Bioscan Complete</h2>
    
    <p className="mb-4">
      Our advanced AI diagnostic system has completed your biometric scan and identified specific areas that require assessment to evaluate your overall health status.
    </p>
    
    <p className="mb-4">
      Based on your unique physical profile, we've customized a series of non-invasive diagnostic tests to measure your physiological and cognitive functions. These assessments will provide valuable data about your current health condition.
    </p>
    
    <div className="my-5 p-4 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-700">
      <h3 className="font-medium text-lg mb-2 text-blue-300">Required Assessments:</h3>
      <ul className="space-y-2">
        <li className="flex items-start">
          <span className="text-blue-400 mr-2">•</span>
          <div>
            <span className="font-medium text-blue-300">Cognitive Assessment</span>
            <p className="text-sm text-gray-400">Analysis indicates potential for memory optimization</p>
          </div>
        </li>
        <li className="flex items-start">
          <span className="text-blue-400 mr-2">•</span>
          <div>
            <span className="font-medium text-blue-300">Cardiovascular Test</span>
            <p className="text-sm text-gray-400">Heart rate patterns require further evaluation</p>
          </div>
        </li>
        <li className="flex items-start">
          <span className="text-blue-400 mr-2">•</span>
          <div>
            <span className="font-medium text-blue-300">Body Composition</span>
            <p className="text-sm text-gray-400">Tissue density scanning indicates BMI assessment needed</p>
          </div>
        </li>
        <li className="flex items-start">
          <span className="text-blue-400 mr-2">•</span>
          <div>
            <span className="font-medium text-blue-300">Reaction Assessment</span>
            <p className="text-sm text-gray-400">Neural pathway response measurement recommended</p>
          </div>
        </li>
        <li className="flex items-start">
          <span className="text-blue-400 mr-2">•</span>
          <div>
            <span className="font-medium text-blue-300">Stability Assessment</span>
            <p className="text-sm text-gray-400">Vestibular system calibration check suggested</p>
          </div>
        </li>
      </ul>
    </div>
    
    <p className="mb-2">
      Please select any highlighted area on your biometric model to begin the corresponding assessment. Your results will be analyzed to create a comprehensive health profile.
    </p>
    
    <p className="text-xs text-gray-400 mt-4">
      <strong>Note:</strong> This medical assessment system is for educational and demonstration purposes only. For accurate health diagnostics, please consult licensed healthcare professionals.
    </p>
  </div>
);

// HEAD: Cognitive (Memory) Test
const CognitiveTest = () => {
  const [gameState, setGameState] = React.useState('intro'); // intro, showing, playing, success, failure
  const [sequence, setSequence] = React.useState([]);
  const [userSequence, setUserSequence] = React.useState([]);
  const [level, setLevel] = React.useState(1);
  const [currentShowIndex, setCurrentShowIndex] = React.useState(0);
  
  // Colors for the memory game
  const colors = ['red', 'blue', 'green', 'yellow'];
  
  // Start a new test
  const startTest = () => {
    // Generate random sequence based on level (level + 2 items)
    const newSequence = Array.from({ length: level + 2 }, () => 
      colors[Math.floor(Math.random() * colors.length)]
    );
    setSequence(newSequence);
    setUserSequence([]);
    setGameState('showing');
    setCurrentShowIndex(0);
    
    // Start showing the sequence
    showNextColor(newSequence, 0);
  };
  
  // Function to display the sequence one color at a time
  const showNextColor = (seq, index) => {
    setCurrentShowIndex(index);
    
    // If we've shown all colors, move to playing state
    if (index >= seq.length) {
      setTimeout(() => {
        setGameState('playing');
        setCurrentShowIndex(-1);
      }, 300);
      return;
    }
    
    // Show the next color after a delay
    setTimeout(() => {
      showNextColor(seq, index + 1);
    }, 800); // Show each color for 800ms
  };
  
  // Handle user selection
  const handleColorClick = (color) => {
    if (gameState !== 'playing') return;
    
    const newUserSequence = [...userSequence, color];
    setUserSequence(newUserSequence);
    
    // Check if selection is correct
    const index = userSequence.length;
    if (color !== sequence[index]) {
      setGameState('failure');
      return;
    }
    
    // Check if sequence is complete
    if (newUserSequence.length === sequence.length) {
      setGameState('success');
      // Advance to next level after delay
      setTimeout(() => {
        setLevel(level + 1);
        setGameState('intro');
      }, 2000);
    }
  };
  
  // Reset the test
  const resetTest = () => {
    setLevel(1);
    setGameState('intro');
  };
  
  return (
    <div className="max-w-md mx-auto bg-gray-900 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2 text-white">Cognitive Assessment</h2>
      <p className="text-sm text-gray-400 mb-4">Testing short-term memory and sequence recall abilities</p>
      
      {gameState === 'intro' && (
        <div>
          <p className="mb-4 text-gray-300">
            This test evaluates your cognitive processing and memory function. Observe the sequence of colors and repeat it exactly. 
            <br/><br/>
            Current difficulty: Level {level} ({level + 2} elements)
          </p>
          <button 
            onClick={startTest}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            Begin Assessment
          </button>
        </div>
      )}
      
      {gameState === 'showing' && (
        <div>
          <p className="mb-3 text-gray-300">Memorize this sequence:</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {colors.map((color, index) => (
              <button
                key={color}
                className={`h-24 rounded-lg border-2 ${
                  sequence[currentShowIndex] === color ? 'border-white border-4 glow' : 'border-gray-800'
                } capitalize font-bold ${
                  color === 'red' ? 'bg-red-600 text-white' :
                  color === 'blue' ? 'bg-blue-600 text-white' :
                  color === 'green' ? 'bg-green-600 text-white' :
                  'bg-yellow-500 text-white'
                }`}
                disabled={true}
              >
                {color}
              </button>
            ))}
          </div>
          <p className="text-center text-gray-300">Pattern recording in progress...</p>
        </div>
      )}
      
      {gameState === 'playing' && (
        <div>
          <p className="mb-3 text-gray-300">Reproduce the sequence:</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorClick(color)}
                className={`h-24 rounded-lg border-2 border-gray-800 capitalize font-bold ${
                  color === 'red' ? 'bg-red-600 text-white' :
                  color === 'blue' ? 'bg-blue-600 text-white' :
                  color === 'green' ? 'bg-green-600 text-white' :
                  'bg-yellow-500 text-white'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
          <div className="flex justify-between items-center text-gray-300">
            <span>Sequence: {userSequence.length}/{sequence.length}</span>
            <button 
              onClick={resetTest}
              className="text-sm px-3 py-1 bg-gray-800 rounded hover:bg-gray-700"
            >
              Reset
            </button>
          </div>
        </div>
      )}
      
      {gameState === 'success' && (
        <div className="text-center py-6">
          <p className="text-green-400 text-xl mb-2">Assessment Successful</p>
          <p className="text-gray-300">Cognitive functioning at level {level} performance.</p>
