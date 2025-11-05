import styled from 'styled-components';

const AppContainer = styled.div`
  text-align: center;
  padding: 20px;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 20px;
`;

function App() {
    return (
        <AppContainer>
            <Title>Chess Multiplayer</Title>
            <p>Welcome to the Chess Platform!</p>
        </AppContainer>
    );
}

export default App;