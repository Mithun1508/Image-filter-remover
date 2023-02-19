; (async () => {
  const model = await tf.loadLayersModel('./model.json');

  document.getElementById(`loading`).hidden = true
  document.getElementById(`upload`).hidden = false

  document.getElementById('input').addEventListener('change', function(evt) {
    let tgt = evt.target || window.event.srcElement,
      files = tgt.files;

    console.log(files)

    if(files.length !== 1) return;

    document.getElementById(`loading`).hidden = false
    document.getElementById(`upload`).hidden = true

    document.getElementById(`loadingText`).innerText = `Getting image`

    if (FileReader && files && files.length) {
      let fr = new FileReader();
      fr.onload = async function() {
        document.getElementById("inputImage").src = fr.result;
        document.getElementById("inputImageVisual").style.backgroundImage = `url(${fr.result})`;

        document.getElementById(`loadingText`).innerText = `Turning into Tensor`

        document.getElementById("inputImage").onload = async()=>{
          let Tensor = tf.browser.fromPixels(document.getElementById("inputImage"), 4)
          Tensor = Tensor.resizeBilinear([64,64]);
  
          document.getElementById(`loadingText`).innerText = `Predicting`
  
          let prediction = await model.predict(tf.stack([Tensor])).data();
  
          console.log(prediction)
  
          document.getElementById(`loadingText`).innerText = `Reversing`
  
          document.getElementById(`filters`).innerHTML = `<h3>Filters detected</h3>
<p>
Brightness: ${Math.round(prediction[0] * 100)}%<br>
Contrast: ${Math.round(prediction[1] * 100)}%<br>
Saturation: ${Math.round(prediction[2])}%<br>
Tint: ${Math.round(prediction[6] * 100)}%<br>
Shade: ${Math.round(prediction[7] * 100)}%<br>
Extra red: ${Math.round(prediction[3])}<br>
Extra green: ${Math.round(prediction[4])}<br>
Extra blue: ${Math.round(prediction[5])}<br>
</p>`
          
          Jimp.read({
            url: fr.result,
          }).then((image)=>{
            if (prediction[0] > 1) prediction[0] = 1
            if (prediction[0] < -1) prediction[0] = -1
            if (prediction[1] > 1) prediction[1] = 1
            if (prediction[1] < -1) prediction[1] = -1
            
            image.brightness(-prediction[0])
            image.contrast(-prediction[1])
            
            image.color([
              { apply: "saturate", params: [-prediction[2]] },
              { apply: "red", params: [-prediction[3]] },
              { apply: "green", params: [-prediction[4]] },
              { apply: "blue", params: [-prediction[5]] },
              { apply: "tint", params: [-prediction[6]] },
              { apply: "shade", params: [-prediction[7]] }
            ]);
  
            image.getBase64('image/png', (err, res) => {
              if(err) throw err;
  
              document.getElementById("output").style.backgroundImage = `url(${res})`;
  
              document.getElementById(`loading`).hidden = true
              document.getElementById(`upload`).hidden = false
            });
          })
        }
      }
      fr.readAsDataURL(files[0]);
    }
  });
})()