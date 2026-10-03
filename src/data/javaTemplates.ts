export interface JavaTemplate {
  id: string;
  name: string;
  category: string;
  code: string;
  defaultStdin?: string;
  description: string;
}

export const JAVA_TEMPLATES: JavaTemplate[] = [
  {
    id: 'hello-world',
    name: '1. Hello World & Variables',
    category: 'Basics',
    description: 'Basic syntax, variables, primitives, and print statement.',
    code: `public class Main {
    public static void main(String[] args) {
        String greeting = "Welcome to Java Programming!";
        int year = 2026;
        double rating = 9.8;
        boolean isAwesome = true;

        System.out.println(greeting);
        System.out.println("Year: " + year + ", Rating: " + rating);
        System.out.println("Is Java awesome? " + isAwesome);
    }
}`,
  },
  {
    id: 'oop-class',
    name: '2. Classes & Objects (OOP)',
    category: 'OOP',
    description: 'Encapsulation, constructors, methods, and instantiation.',
    code: `class Developer {
    private String name;
    private String stack;

    public Developer(String name, String stack) {
        this.name = name;
        this.stack = stack;
    }

    public void displayProfile() {
        System.out.println("Developer: " + name + " | Stack: " + stack);
    }
}

public class Main {
    public static void main(String[] args) {
        Developer dev1 = new Developer("Alex", "Java + Spring Boot");
        Developer dev2 = new Developer("Sam", "Microservices");

        dev1.displayProfile();
        dev2.displayProfile();
    }
}`,
  },
  {
    id: 'arrays-loops',
    name: '3. Arrays & Enhanced For-Loop',
    category: 'Data Structures',
    description: 'Array allocation, values, and modern for-each iteration.',
    code: `public class Main {
    public static void main(String[] args) {
        String[] topics = {"JVM", "Stack & Heap", "JDBC", "Spring Boot", "Microservices"};

        System.out.println("Core Java Roadmap Topics:");
        for (int i = 0; i < topics.length; i++) {
            System.out.println((i + 1) + ". " + topics[i]);
        }
    }
}`,
  },
  {
    id: 'multithreading',
    name: '4. Multithreading (Runnable)',
    category: 'Concurrency',
    description: 'Concurrent threads using Runnable interface and lambda expressions.',
    code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Main thread running: " + Thread.currentThread().getName());

        Runnable task1 = () -> {
            for (int i = 1; i <= 3; i++) {
                System.out.println("[Worker-1] Iteration " + i);
                try { Thread.sleep(50); } catch (Exception ignored) {}
            }
        };

        Runnable task2 = () -> {
            for (int i = 1; i <= 3; i++) {
                System.out.println("[Worker-2] Processing item " + i);
                try { Thread.sleep(50); } catch (Exception ignored) {}
            }
        };

        Thread t1 = new Thread(task1, "Worker-1");
        Thread t2 = new Thread(task2, "Worker-2");

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (Exception ignored) {}

        System.out.println("All threads finished successfully!");
    }
}`,
  },
  {
    id: 'collections-map',
    name: '5. Collections & HashMap',
    category: 'Collections',
    description: 'Dynamic List and Key-Value Map data structures.',
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // List demo
        List<String> frameworks = new ArrayList<>(Arrays.asList("Spring Core", "Spring Boot", "Hibernate"));
        frameworks.add("Eureka Registry");

        System.out.println("Framework list: " + frameworks);

        // Map demo
        Map<String, Integer> courseDurations = new LinkedHashMap<>();
        courseDurations.put("Core Java", 12);
        courseDurations.put("JDBC", 2);
        courseDurations.put("Spring Boot", 8);
        courseDurations.put("Microservices", 4);

        System.out.println("\\nCourse Module Hours:");
        for (Map.Entry<String, Integer> entry : courseDurations.entrySet()) {
            System.out.println("- " + entry.getKey() + ": " + entry.getValue() + " hrs");
        }
    }
}`,
  },
  {
    id: 'stream-api',
    name: '6. Stream API & Lambdas',
    category: 'Functional',
    description: 'Declarative pipelines with filter, map, sorted, and collect.',
    code: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<String> concepts = Arrays.asList(
            "Java", "Spring Boot", "Microservices", "Docker", "Kubernetes", "Kafka", "SQL"
        );

        // Filter words longer than 4 chars, convert to uppercase, and sort
        List<String> filtered = concepts.stream()
            .filter(c -> c.length() > 4)
            .map(String::toUpperCase)
            .sorted()
            .collect(Collectors.toList());

        System.out.println("Original concepts count: " + concepts.size());
        System.out.println("Filtered & transformed: " + filtered);
    }
}`,
  },
  {
    id: 'scanner-input',
    name: '7. Console Input (Scanner)',
    category: 'IO',
    description: 'Reading user input from stdin console.',
    defaultStdin: "Antigravity Dev\n3",
    code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.print("Enter your developer name: ");
        if (scanner.hasNextLine()) {
            String name = scanner.nextLine();
            System.out.println("Hello, " + name + "!");
        }

        System.out.print("Enter number of chapters to study today: ");
        if (scanner.hasNextInt()) {
            int chapters = scanner.nextInt();
            System.out.println("Goal set: Complete " + chapters + " chapters today!");
        }

        scanner.close();
    }
}`,
  },
];
