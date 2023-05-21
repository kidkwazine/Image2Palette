// Image2Palette - rob (aka kid kwazine) - may 2023

import React, { useState, useEffect } from 'react';
import Dropzone from 'react-dropzone';
import ColorThief from 'colorthief';
import { saveAs as fileSaversaveAs } from 'file-saver';
import { IoRefresh } from 'react-icons/io5';
import { FaGithub } from 'react-icons/fa';
import { MdAddPhotoAlternate } from "react-icons/md";
import './App.css';

/* Footer Typewriter Animation */
// Using CSS width had issues on iOS so this made more sense for now.
// Keeping this outside of the app function so it doesn't re-render (or reanimate) on state changes.
const TypewriterText = ({ text, children }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText((prevText) => prevText + text[currentIndex]);
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }
    }, 24);

    return () => {
      clearInterval(timer);
    };
  }, [text, currentIndex]);

  return (
    <p>
      {displayedText}
      {displayedText === text && children}
    </p>
  );
};

const App = () => {
  const [image, setImage] = useState(null);
  const [colorPalette, setColorPalette] = useState([]);
  const [paletteSize, setPaletteSize] = useState(5);
  const [imageClicked, setImageClicked] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [copiedColor, setCopiedColor] = useState('');

  const [fileName, setFileName] = useState('color_');
  const [showPaletteControls, setShowPaletteControls] = useState(false);
  const [showFooterLink, setShowFooterLink] = useState(false);
  const [isDropzoneHovered, setIsDropzoneHovered] = useState(false);
  const isMobile = window.innerWidth <= 768; // Define the mobile screen width threshold here

  
  /* On Drop Event*/
  const handleDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    if (file && file.type.startsWith('image/')) {  // Makes sure you're importing a single image file
      reader.readAsDataURL(file);

      reader.onload = () => {
        const imageDataUrl = reader.result;
        setImage(imageDataUrl);

        const fileName = file.name;
        setFileName(fileName);
        generateColorPalette(imageDataUrl, paletteSize);
        setImageClicked(true);
        setShowPaletteControls(true);
        setIsDropzoneHovered(false);
      };
    } else {
      alert('Please select a single image file!');
    }
  };

  /* Palette Generation*/
  // God bless ColorThief.
  const generateColorPalette = (imageUrl, size) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      const colorThief = new ColorThief();
      const colors = colorThief.getPalette(img, size);

      setColorPalette(colors);
    };

    img.src = imageUrl;
  };


  /*Hexcode Copypasta*/
  // This isn't an optimal method, but it's the method that seemed to work around browser protections against APIs doing anything with the clipboard
  // Basically just displays the text in a (non-visible) input field + copies it from there.
  const copyToClipboard = (hexcode) => {
    const textField = document.createElement('textarea');
    textField.value = hexcode;
    textField.className = 'invisible';
    document.body.appendChild(textField);
    textField.select();
    document.execCommand('copy');
    textField.remove();
  };

  const handleCopy = (hexcode) => {
    copyToClipboard(hexcode);
    setCopiedColor(hexcode);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 2000);
  };

  /*Palette to PNG*/
  const handleSavePalette = () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = colorPalette.length; // Makes the PNG's width in pxels the same number as the palette array length
    canvas.height = 1; // Enforce the 1px high rule for strips

    colorPalette.forEach((color, index) => {
      context.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      context.fillRect(index, 0, 1, 1);
    });

    const paletteFileName = `${fileName.split('.')[0]}_palette.png`; // Handles the file name of the exported PNG strip

    canvas.toBlob((blob) => {
      fileSaversaveAs(blob, paletteFileName);
    });
  };

  /*Handles Palette Size Changes*/
  const handlePaletteSizeChange = (event) => {
    const newSize = parseInt(event.target.value);

    if (event.target.value === '') {  // Jank fix for being unable to delete numbers in field on mobile
      setPaletteSize('');
      return;
    }

    if (event.target.value === '1') { // Jank fix for not being able to type numbers that start with '1' on mobile
      setPaletteSize('1');
      return;
    }


    if (newSize >= 1 && newSize <= 12) {
      setPaletteSize(newSize);
      generateColorPalette(image, newSize);
    }
  };

  // Just a little jank to make sure our footer link shows up after the typewriter animation!
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFooterLink(true);
    }, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, []);


  return (
    <div className="container">
      <div class="bg"></div>
      <header className="header">
      <h1 className={`title ${imageClicked ? 'image-clicked' : ''}`}>
          <a className="two" href="#top" onClick={() => window.location.reload()}>Image2Palette</a></h1>
        {!imageClicked && (
          <>
            <p className="subtitle">Generate color palette PNG strips from images within your browser.</p>
            <p className="subtitle-two">No uploading required.</p>
          </>
        )}
      </header>
      <div
        // Dropzone hover detection
        className={`content ${isDropzoneHovered ? 'dropzone:hover' : ''}`}
        onMouseEnter={() => setIsDropzoneHovered(true)}
        onMouseLeave={() => setIsDropzoneHovered(false)}

      >


        <Dropzone onDrop={handleDrop} accept="image/*" maxFiles={1}>
          {({ getRootProps, getInputProps }) => (
            <div {...getRootProps({ className: 'dropzone' })}>
               <input {...getInputProps()} accept="image/*" multiple={false} />
              {image ? (
                <>
                  <img src={image} alt="Target" className="uploaded-image" onClick={() => setImageClicked(true)} />
                  {imageClicked && (
                    <div className="restart-icon">
                      <IoRefresh />
                    </div>
                  )}
                  {showNotification && (
                    <div className="notification">
                      <span className="copied-color">{copiedColor}</span> is copied to clipboard!
                    </div>
                  )}

                </>
              ) : (
                <>
                  <p className="img-icon"><MdAddPhotoAlternate /></p>
                  {isMobile ? '' : <p>DROP IMAGE HERE</p>}

                </>
              )}
            </div>
          )}
        </Dropzone>

        <div className="color-palette">
          {colorPalette.map((color, index) => (
            <div
              key={index}
              style={{
                backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
              }}
              className="color"
              onClick={() =>
                handleCopy(  // Formats our hexcode string
                  '#' + color
                    .map((c) => c.toString(16).padStart(2, '0'))
                    .join('')
                    .toUpperCase()
                )
              }
            ></div>
          ))}

        </div>

        {showPaletteControls && (  // Palette Size user controls
          <div className="palette-controls">
            <label htmlFor="palette-size">Palette Size:</label>
            <input
              type="number"
              id="palette-size"
              value={paletteSize}
              min="2"
              max="12"
              onChange={handlePaletteSizeChange}
              inputMode="numeric"

            />
          </div>
        )}
        {colorPalette.length > 0 && <button onClick={handleSavePalette}>Save Palette PNG</button>}
      </div>

      <footer className="footer">
        {showFooterLink && (
          <TypewriterText text="made with all the love in the world by ">
            <a className="three" href="https://twitter.com/kidkwazine">
              <br></br>rob (aka kid kwazine)
            </a>
          </TypewriterText>
        )}
        <div className="github-icon">
          <a href="https://github.com/kidkwazine/Image2Palette">
            <FaGithub />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;