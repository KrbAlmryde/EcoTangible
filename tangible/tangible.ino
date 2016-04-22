void setup() {
  // put your setup code here, to run once:

}

void loop() {
  // put your main code here, to run repeatedly:
  if(digitalRead(5) == HIGH){
    Serial.println("0 0 0");  // "We have a swale"
    delay(1000);
  } else if (digitalRead(4) == HIGH) {
    Serial.println("We have a rain barrel");
    delay(1000);
  } else
    Serial.print("\n");
}
