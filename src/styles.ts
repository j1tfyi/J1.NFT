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

  /* Cloud Content */
  .cloud-content {
    bottom: 0;
    left: 0;
    padding-top: 50px;
    position: fixed;
    right: 0;
    top: 0;
    z-index: -1;
    pointer-events: none;
  }

  .cloud-block {
    position: absolute;
    opacity: 0.4;
  }

  .cloud-1 {
    top: 50px;
    animation: animate-1 32s linear infinite;
    -webkit-animation: animate-1 83s linear infinite;
    transform: scale(0.75);
    -webkit-transform: scale(0.95);
  }

  .cloud-2 {
    top: 40vh;
    animation: animate-2 37s linear infinite;
    -webkit-animation: animate-2 87s linear infinite;
    transform: scale(0.45);
    -webkit-transform: scale(0.45);
  }

  .cloud-3 {
    top: 20vh;
    animation: animate-3 45s linear infinite;
    -webkit-animation: animate-3 85s linear infinite;
    transform: scale(0.5);
    -webkit-transform: scale(0.5);
  }

  .cloud-4 {
    top: 40vh;
    animation: animate-4 50s linear infinite;
    -webkit-animation: animate-4 100s linear infinite;
    transform: scale(0.8);
    -webkit-transform: scale(0.2);
  }

  .cloud-5 {
    top: 65vh;
    animation: animate-5 55s linear infinite;
    -webkit-animation: animate-5 105s linear infinite;
    transform: scale(0.55);
    -webkit-transform: scale(0.55);
  }

  .cloud-6 {
    top: 35vh;
    animation: animate-6 60s linear infinite;
    -webkit-animation: animate-6 110s linear infinite;
    transform: scale(0.85);
    -webkit-transform: scale(0.85);
  }

  .cloud-7 {
    bottom: 30px;
    animation: animate-7 65s linear infinite;
    -webkit-animation: animate-7 115s linear infinite;
    transform: scale(0.5);
    -webkit-transform: scale(0.5);
  }

  /* Cloud Objects */
  .cloud {
    width: 350px;
    height: 350px;
    box-shadow: 0 16px 16px rgba(0, 0, 0, 0.1);
    -webkit-box-shadow: 0 16px 16px rgba(0, 0, 0, 0.1);
    position: relative;
    background: url(/mf.png);
    background-repeat: no-repeat;
  }

  /* KEYFRAMES */
  @keyframes animate-1 {
    0% {
      left: 90%;
    }
    10% {
      left: 110%;
    }
    10.001% {
      left: -10%;
    }
    100% {
      left: 90%;
    }
  }

  @keyframes animate-2 {
    0% {
      left: 75%;
    }
    25% {
      left: 110%;
    }
    25.001% {
      left: -10%;
    }
    100% {
      left: 75%;
    }
  }

  @keyframes animate-3 {
    0% {
      left: 60%;
    }
    40% {
      left: 110%;
    }
    40.001% {
      left: -10%;
    }
    100% {
      left: 60%;
    }
  }

  @keyframes animate-4 {
    0% {
      left: 45%;
    }
    55% {
      left: 110%;
    }
    55.001% {
      left: -10%;
    }
    100% {
      left: 45%;
    }
  }

  @keyframes animate-5 {
    0% {
      left: 30%;
    }
    70% {
      left: 110%;
    }
    70.001% {
      left: -10%;
    }
    100% {
      left: 30%;
    }
  }

  @keyframes animate-6 {
    0% {
      left: 10%;
    }
    90% {
      left: 110%;
    }
    90.001% {
      left: -10%;
    }
    100% {
      left: 10%;
    }
  }

  @keyframes animate-7 {
    0% {
      left: -10%;
    }
    99.99% {
      left: 110%;
    }
    100% {
      left: -10%;
    }
  }

  /* Responsive media query */
  @media screen and (max-width: 767px) {
    .cloud {
      width: 150px;
      height: 260px;
    }

    .cloud-1 {
      animation: animate-1 32s linear infinite;
      -webkit-animation: animate-1 43s linear infinite;
      transform: scale(0.45);
      -webkit-transform: scale(0.45);
    }

    .cloud-2 {
      animation: animate-2 37s linear infinite;
      -webkit-animation: animate-2 47s linear infinite;
      transform: scale(0.25);
      -webkit-transform: scale(0.25);
    }

    .cloud-3 {
      animation: animate-3 45s linear infinite;
      -webkit-animation: animate-3 45s linear infinite;
      transform: scale(0.3);
      -webkit-transform: scale(0.3);
    }

    .cloud-4 {
      animation: animate-4 50s linear infinite;
      -webkit-animation: animate-4 60s linear infinite;
      transform: scale(0.6);
      -webkit-transform: scale(0.6);
    }

    .cloud-5 {
      animation: animate-5 55s linear infinite;
      -webkit-animation: animate-5 65s linear infinite;
      transform: scale(0.45);
      -webkit-transform: scale(0.45);
    }

    .cloud-6 {
      animation: animate-6 60s linear infinite;
      -webkit-animation: animate-6 70s linear infinite;
      transform: scale(0.55);
      -webkit-transform: scale(0.55);
    }

    .cloud-7 {
      animation: animate-7 65s linear infinite;
      -webkit-animation: animate-7 75s linear infinite;
      transform: scale(0.3);
      -webkit-transform: scale(0.3);
    }
  }
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