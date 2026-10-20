import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

class HelloWorldTest {
    @Test
    void saysHelloWorld() {
        assertEquals("Hello, World!", HelloWorld.message());
    }
}
