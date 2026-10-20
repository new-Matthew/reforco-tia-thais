import org.junit.platform.launcher.Launcher;
import org.junit.platform.launcher.LauncherDiscoveryRequest;
import org.junit.platform.launcher.core.LauncherDiscoveryRequestBuilder;
import org.junit.platform.launcher.core.LauncherFactory;
import org.junit.platform.launcher.listeners.SummaryGeneratingListener;
import static org.junit.platform.engine.discovery.DiscoverySelectors.selectClass;
import java.io.PrintWriter;

public class RunTests {
    public static void main(String[] args) throws Exception {
        LauncherDiscoveryRequest request = LauncherDiscoveryRequestBuilder.request()
            .selectors(selectClass("HelloWorldTest"))
            .filters(org.junit.platform.launcher.EngineFilter.includeEngines("junit-jupiter"))
            .build();
        Launcher launcher = LauncherFactory.create();
        SummaryGeneratingListener listener = new SummaryGeneratingListener();
        launcher.registerTestExecutionListeners(listener);
        launcher.execute(request);
        listener.getSummary().printTo(new PrintWriter(System.out));
        listener.getSummary().printFailuresTo(new PrintWriter(System.out));
        if (listener.getSummary().getTotalFailureCount() > 0) System.exit(1);
    }
}
