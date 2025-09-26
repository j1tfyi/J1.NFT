import styled from 'styled-components';

export const StyledContainer = styled('div')<any>`
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin-right: auto;
  margin-left: auto;
  padding: 0 60px;
  border-top: ${(p) => (p.border ? '1px solid #CDD1D4' : '')};
  @media only screen and (max-width: 1024px) {
    max-width: calc(100% - 68px);
    padding: 0 30px;
  }

  @media only screen and (max-width: 768px) {
    max-width: calc(100% - 38px);
    padding: 0 18px;
  }

  @media only screen and (max-width: 414px) {
    max-width: 100%;
    padding: 0 18px;
  }
`;

export const Root = styled('div')`
  position: relative;
  z-index: 99;
`;

export const Hero = styled('div')`
  text-align: center;
  margin: 80px 0 80px;
`;

export const MintCount = styled('h3')`
  font-family: 'Audiowide', sans-serif;
  font-size: 30px;
  line-height: 1;
  margin-bottom: 20px;
  margin-top: 25px;
  font-weight: 700;
  color: #cc0000;
  text-shadow: 0 0 8px rgba(204, 0, 0, 0.5);
`;

export const Heading = styled('h1')`
  font-family: 'Audiowide', sans-serif;
  letter-spacing: 2px;
  margin-bottom: -20px;
  color: #990000;
  font-size: 60px;
  text-shadow: 0 0 8px rgba(153, 0, 0, 0.5);
`;

export const MintButtonStyled = styled('button')`
  border: 2px solid #990000;
  background: linear-gradient(135deg, #990000 0%, #cc0000 100%);
  border-radius: 10px;
  padding: 16px;
  font-size: 28px;
  min-width: 300px;
  box-shadow: 0 4px 20px rgba(153, 0, 0, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Audiowide', sans-serif;
  color: white;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);

  :hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 6px 25px rgba(153, 0, 0, 0.6);
    border-color: #ff0000;
    background: linear-gradient(135deg, #cc0000 0%, #ff3333 100%);
  }

  :disabled {
    background: linear-gradient(135deg, #660000 0%, #990000 100%);
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const NftWrapper = styled('div')`
  position: relative;
  z-index: 99;
  .marquee-wrapper {
    overflow: hidden;
    transform: skew(360deg, 356deg);
  }

  .marquee {
    display: flex;
    animation-name: marquee;
    animation-duration: 50s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    animation-direction: alternate;
    transform: translateX(0);
    img {
      padding: 5px;
      max-width: 200px;
      border-radius: 10px;
      filter: none !important;
    }
  }

  @keyframes marquee {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-100%);
    }
  }
`;

export const NftWrapper2 = styled('div')`
  position: relative;
  z-index: 99;
  .marquee-wrapper {
    overflow: hidden;
    transform: skew(360deg, 356deg);
  }

  .marquee {
    display: flex;
    animation-name: marquee2;
    animation-duration: 50s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    animation-direction: alternate;
    transform: translateX(0);

    img {
      padding: 5px;
      max-width: 200px;
      border-radius: 10px;
      filter: none !important;
    }
  }

  @keyframes marquee2 {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }
`;