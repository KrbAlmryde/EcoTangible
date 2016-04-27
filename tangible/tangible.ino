void setup() {
  // put your setup code here, to run once:

}

void loop() {
  // put your main code here, to run repeatedly:
  if(digitalRead(6) == HIGH){
    Serial.println("60 50 0");  // "We have a swale"
    delay(1000);
  }
  if (digitalRead(5) == HIGH) {
    Serial.println("10 50 1");
    delay(1000);
  }
  if (digitalRead(4) == HIGH) {
    Serial.println("0 0 1");
    delay(1000);
  }
   // else
   //  Serial.print("\n");
}
